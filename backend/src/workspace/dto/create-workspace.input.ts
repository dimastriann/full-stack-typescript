import { InputType, Field } from '@nestjs/graphql';
import { IsSanitizedString } from '../../common/decorators/sanitized-string.decorator';

@InputType()
export class CreateWorkspaceInput {
  @Field()
  @IsSanitizedString()
  name: string;

  @Field({ nullable: true })
  @IsSanitizedString()
  description?: string;
}
