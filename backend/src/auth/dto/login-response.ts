import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';

@ObjectType()
export class LoginResponse {
  @Field({ nullable: true })
  access_token?: string;

  @Field({ nullable: true })
  refresh_token?: string;

  @Field({ nullable: true })
  session_id?: string;

  @Field(() => User, { nullable: true })
  user?: User;

  /** Set to true when the user has 2FA enabled — full session is NOT yet created. */
  @Field({ nullable: true, defaultValue: false })
  requiresTwoFactor?: boolean;

  /** Short-lived pre-auth JWT issued when 2FA is required, used to complete login. */
  @Field({ nullable: true })
  preAuthToken?: string;
}
