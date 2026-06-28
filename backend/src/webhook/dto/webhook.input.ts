import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsIn,
} from 'class-validator';

const VALID_WEBHOOK_EVENTS = [
  'task.created',
  'task.updated',
  'task.deleted',
  'project.created',
  'project.updated',
  'project.deleted',
];

@InputType()
export class CreateWebhookInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  workspaceId: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsUrl({}, { message: 'Must be a valid URL' })
  @IsNotEmpty()
  url: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  @IsIn(VALID_WEBHOOK_EVENTS, {
    each: true,
    message: 'Invalid webhook event type',
  })
  events: string[];
}

@InputType()
export class UpdateWebhookInput {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  id: number;

  @Field({ nullable: true })
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Field({ nullable: true })
  @IsUrl({}, { message: 'Must be a valid URL' })
  @IsNotEmpty()
  url?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsIn(VALID_WEBHOOK_EVENTS, {
    each: true,
    message: 'Invalid webhook event type',
  })
  events?: string[];

  @Field({ nullable: true })
  @IsBoolean()
  isActive?: boolean;
}
