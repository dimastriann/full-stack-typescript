import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { Project } from 'src/project/entities/project.entity';
import { ProjectRole } from 'prisma/generated/enums';

// Register the Prisma enum with GraphQL
registerEnumType(ProjectRole, {
  name: 'ProjectRole',
  description:
    'The role a user has in a project - OWNER (full control), ADMIN (manage members), MEMBER (contribute), VIEWER (read-only)',
});

/**
 * ProjectMember entity represents the many-to-many relationship
 * between Users and Projects with role-based access control
 */
@ObjectType()
export class ProjectMember {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => Int)
  projectId: number;

  @Field(() => ProjectRole)
  role: ProjectRole;

  @Field()
  joinedAt: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Relations
  @Field(() => User)
  user: User;

  @Field(() => Project)
  project: Project;
}
