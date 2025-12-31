import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '../../../prisma/generated/client';
export { UserRole };

registerEnumType(UserRole, {
  name: 'UserRole',
});

@InputType()
export class CreateUserInput {
  @Field()
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
  firstName: string;

  @Field({ nullable: true })
  lastName: string;

  @Field({ defaultValue: true })
  status: boolean;

  @Field({ nullable: true })
  address: string;

  @Field({ nullable: true })
  bio: string;

  @Field({ nullable: true })
  birthDate: Date;

  @Field(() => UserRole, { defaultValue: UserRole.USER })
  role: UserRole;
}
