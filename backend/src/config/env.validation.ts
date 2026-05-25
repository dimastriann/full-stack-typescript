import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;
}

export function validate(config: Record<string, any>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const errorDetails = errors
      .map(err => {
        const constraints = err.constraints ? Object.values(err.constraints).join(', ') : 'unknown constraint';
        return `  - ${err.property}: ${constraints}`;
      })
      .join('\n');
    
    throw new Error(
      `\n========================================================================\n` +
      `🔥 ENV STARTUP ERROR: Missing or invalid required environment variables!\n` +
      `========================================================================\n` +
      `${errorDetails}\n` +
      `========================================================================\n`
    );
  }
  return validatedConfig;
}
