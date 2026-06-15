import { BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { PlanLevel, SubscriptionStatus } from '../../prisma/generated/client';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPrisma = {
  subscription: {
    findUnique: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  project: {
    count: jest.fn(),
  },
  workspaceMember: {
    count: jest.fn(),
  },
  planFeatureLimit: {
    findUnique: jest.fn(),
  },
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:5173'),
};

const mockProviderFactory = {
  getDefaultProvider: jest.fn(),
  getProvider: jest.fn(),
};

function buildService() {
  return new SubscriptionService(
    mockPrisma as never,
    mockConfigService as never,
    mockProviderFactory as never,
  );
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('SubscriptionService', () => {
  afterEach(() => jest.clearAllMocks());

  // ── getPlanLimits ──────────────────────────────────────────────────────────

  describe('getPlanLimits()', () => {
    it('returns limits from DB for a PRO subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        planLevel: PlanLevel.PRO,
        status: SubscriptionStatus.ACTIVE,
        customLimits: null,
      });
      mockPrisma.planFeatureLimit.findUnique.mockResolvedValue({
        maxProjects: 20,
        maxMembers: 50,
        maxStorageGb: 50,
      });

      const service = buildService();
      const limits = await service.getPlanLimits(1);

      expect(limits).toEqual({
        maxProjects: 20,
        maxMembers: 50,
        maxStorageGb: 50,
      });
    });

    it('returns FREE fallback defaults when no limits row exists in DB', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      mockPrisma.planFeatureLimit.findUnique.mockResolvedValue(null);

      const service = buildService();
      const limits = await service.getPlanLimits(99);

      expect(limits).toEqual({
        maxProjects: 5,
        maxMembers: 10,
        maxStorageGb: 2,
      });
    });

    it('uses customLimits JSON for a CUSTOM plan subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        planLevel: PlanLevel.CUSTOM,
        customLimits: { maxProjects: 100, maxMembers: 200, maxStorageGb: 500 },
      });

      const service = buildService();
      const limits = await service.getPlanLimits(5);

      expect(limits.maxProjects).toBe(100);
      expect(mockPrisma.planFeatureLimit.findUnique).not.toHaveBeenCalled();
    });
  });

  // ── checkProjectLimit ──────────────────────────────────────────────────────

  describe('checkProjectLimit()', () => {
    beforeEach(() => {
      // Default: FREE plan with limit of 5 projects
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      mockPrisma.planFeatureLimit.findUnique.mockResolvedValue(null);
    });

    it('allows creation when under the project limit', async () => {
      mockPrisma.project.count.mockResolvedValue(3);

      const service = buildService();
      await expect(service.checkProjectLimit(1)).resolves.toBeUndefined();
    });

    it('throws BadRequestException with PLAN_LIMIT_EXCEEDED when at limit', async () => {
      mockPrisma.project.count.mockResolvedValue(5); // at FREE limit

      const service = buildService();
      await expect(service.checkProjectLimit(1)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await service.checkProjectLimit(1);
      } catch (e) {
        const err = e as BadRequestException;
        const response = err.getResponse() as Record<string, unknown>;
        expect(response['code']).toBe('PLAN_LIMIT_EXCEEDED');
        expect(response['message']).toMatch(/maximum of 5 projects/);
      }
    });

    it('skips check when maxProjects is -1 (unlimited)', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        planLevel: PlanLevel.ENTERPRISE,
        customLimits: null,
      });
      mockPrisma.planFeatureLimit.findUnique.mockResolvedValue({
        maxProjects: -1,
        maxMembers: -1,
        maxStorageGb: -1,
      });

      const service = buildService();
      await expect(service.checkProjectLimit(1)).resolves.toBeUndefined();
      expect(mockPrisma.project.count).not.toHaveBeenCalled();
    });
  });

  // ── checkMemberLimit ───────────────────────────────────────────────────────

  describe('checkMemberLimit()', () => {
    beforeEach(() => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      mockPrisma.planFeatureLimit.findUnique.mockResolvedValue(null);
    });

    it('allows inviting when under member limit', async () => {
      mockPrisma.workspaceMember.count.mockResolvedValue(5);

      const service = buildService();
      await expect(service.checkMemberLimit(1)).resolves.toBeUndefined();
    });

    it('throws with PLAN_LIMIT_EXCEEDED when at member limit', async () => {
      mockPrisma.workspaceMember.count.mockResolvedValue(10);

      const service = buildService();
      await expect(service.checkMemberLimit(1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── handleWebhook ──────────────────────────────────────────────────────────

  describe('handleWebhook()', () => {
    it('calls _activateSubscription on payment.succeeded event', async () => {
      const mockProvider = {
        constructWebhookEvent: jest.fn().mockResolvedValue({
          type: 'payment.succeeded',
          providerSubscriptionId: 'sub_001',
          providerCustomerId: 'cus_001',
        }),
      };
      mockProviderFactory.getProvider.mockResolvedValue(mockProvider);

      const service = buildService();
      const result = await service.handleWebhook(
        'STRIPE' as never,
        Buffer.from('{}'),
        'sig',
      );

      expect(result).toEqual({ received: true });
      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { providerSubscriptionId: 'sub_001' },
          data: expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
        }),
      );
    });

    it('calls cancel on subscription.canceled event', async () => {
      const mockProvider = {
        constructWebhookEvent: jest.fn().mockResolvedValue({
          type: 'subscription.canceled',
          providerSubscriptionId: 'sub_002',
        }),
      };
      mockProviderFactory.getProvider.mockResolvedValue(mockProvider);

      const service = buildService();
      await service.handleWebhook('STRIPE' as never, Buffer.from('{}'), 'sig');

      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubscriptionStatus.CANCELED,
          }),
        }),
      );
    });
  });
});
