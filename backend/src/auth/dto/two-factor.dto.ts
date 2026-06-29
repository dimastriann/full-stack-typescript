import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class TwoFactorSetupResponse {
  /** The TOTP secret key (shown to user for manual entry). */
  @Field()
  secret: string;

  /**
   * The otpauth:// URI that can be encoded as a QR code.
   * e.g. otpauth://totp/ProjectFlow:user@email.com?secret=BASE32&issuer=ProjectFlow
   */
  @Field()
  otpauthUrl: string;
}

@ObjectType()
export class TwoFactorEnableResponse {
  /** Indicates 2FA was successfully enabled. */
  @Field()
  enabled: boolean;

  /**
   * One-time backup codes. Shown exactly once — user must save these.
   * Each code can be used once to bypass TOTP if the authenticator is lost.
   */
  @Field(() => [String])
  backupCodes: string[];
}
