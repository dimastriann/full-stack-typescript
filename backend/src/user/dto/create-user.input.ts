import { InputType, Field } from '@nestjs/graphql';

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
}
