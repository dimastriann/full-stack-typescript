import 'reflect-metadata';
import { validate } from './env.validation';

describe('Environment Variable Validation', () => {
  it('should pass and convert valid config', () => {
    const validConfig = {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/mydb',
      JWT_SECRET_KEY: 'supersecretkey',
      PORT: '3000',
      NODE_ENV: 'development',
    };

    const result = validate(validConfig);

    expect(result.DATABASE_URL).toBe(validConfig.DATABASE_URL);
    expect(result.JWT_SECRET_KEY).toBe(validConfig.JWT_SECRET_KEY);
    expect(result.PORT).toBe(3000); // Converted implicitly to number
    expect(result.NODE_ENV).toBe('development');
  });

  it('should throw an error if critical variables are missing', () => {
    const invalidConfig = {
      PORT: '3000',
    };

    expect(() => validate(invalidConfig)).toThrow(
      /Missing or invalid required environment variables/
    );
  });

  it('should throw an error if fields have invalid types', () => {
    const invalidConfig = {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/mydb',
      JWT_SECRET_KEY: 'supersecretkey',
      NODE_ENV: 'invalid-env-name', // Should be development, production, or test
    };

    expect(() => validate(invalidConfig)).toThrow(
      /Missing or invalid required environment variables/
    );
  });
});
