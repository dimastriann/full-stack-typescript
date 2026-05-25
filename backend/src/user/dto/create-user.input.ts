import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '../../../prisma/generated/client';
import { IsSanitizedString } from '../../common/decorators/sanitized-string.decorator';
export { UserRole };

registerEnumType(UserRole, {
  name: 'UserRole',
});

@InputType()
export class CreateUserInput {
  @Field()
  @IsSanitizedString()
  name: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  phone: string;

  @Field({ nullable: true })
  mobile: string;

  @Field()
  @IsSanitizedString()
  firstName: string;

  @Field({ nullable: true })
  @IsSanitizedString()
  lastName: string;

  @Field({ defaultValue: true })
  status: boolean;

  @Field({ nullable: true })
  @IsSanitizedString()
  address: string;

  @Field({ nullable: true })
  @IsSanitizedString()
  bio: string;

  @Field({ nullable: true })
  birthDate: Date;

  @Field(() => UserRole, { defaultValue: UserRole.USER })
  role: UserRole;
}
