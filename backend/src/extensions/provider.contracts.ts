/** Core-owned seams implemented by optional providers (including Pro). */
export interface StorageProvider {
  put(input: {
    key: string;
    content: Buffer;
    contentType?: string;
  }): Promise<string>;
  remove(key: string): Promise<void>;
}

export interface PaymentProvider {
  createCheckout(input: {
    workspaceId: string;
    plan: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ checkoutUrl: string }>;
}

export interface AutomationProvider {
  register(workspaceId: string, definition: unknown): Promise<void>;
}

export interface IntegrationProvider {
  sync(workspaceId: string, cursor?: string): Promise<{ cursor?: string }>;
}

export interface AuditExportProvider {
  export(
    workspaceId: string,
    from?: Date,
    to?: Date,
  ): Promise<AsyncIterable<unknown>>;
}

export interface BackupProvider {
  create(workspaceId: string): Promise<{ id: string; createdAt: Date }>;
  restore(workspaceId: string, backupId: string): Promise<void>;
}
