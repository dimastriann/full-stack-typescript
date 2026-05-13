import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mockToken'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return an access token and user info', () => {
      const user = { id: 1, email: 'test@example.com' };
      const result = service.login(user);

      expect(result).toEqual({
        access_token: 'mockToken',
        user: user,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: user.email,
        sub: user.id,
      });
    });
  });
});
