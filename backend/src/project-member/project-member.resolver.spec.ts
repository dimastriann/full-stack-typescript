import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMemberResolver } from './project-member.resolver';

describe('ProjectMemberResolver', () => {
  let resolver: ProjectMemberResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectMemberResolver],
    }).compile();

    resolver = module.get<ProjectMemberResolver>(ProjectMemberResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
