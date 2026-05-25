import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { filterXSS } from 'xss';

/**
 * Custom validator decorator that sanitizes string inputs against XSS attacks.
 * Uses the `xss` library which works in Node.js (unlike DOMPurify which requires a DOM).
 *
 * When applied to a DTO field, it:
 * 1. Validates the value is a string
 * 2. Checks if the string contains potentially dangerous XSS content
 * 3. Rejects the value if XSS content is detected
 *
 * @example
 * ```typescript
 * @Field()
 * @IsSanitizedString()
 * name: string;
 * ```
 */
export function IsSanitizedString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSanitizedString',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: `${propertyName} contains potentially unsafe content`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (value === null || value === undefined) {
            return true; // Let @IsOptional() or @IsNotEmpty() handle null/undefined
          }

          if (typeof value !== 'string') {
            return false;
          }

          // Sanitize the value using xss
          const sanitized = filterXSS(value);

          // If sanitization changed the value, it contained potentially dangerous content
          return sanitized === value;
        },
      },
    });
  };
}

/**
 * Utility function to sanitize a string value.
 * Can be used in services/resolvers when you need to sanitize
 * values that don't go through DTO validation (e.g. WebSocket messages).
 */
export function sanitizeString(value: string): string {
  return filterXSS(value);
}
