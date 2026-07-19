import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentProposalsService } from '../assignment-proposals.service';

describe('assignment-proposals/AssignmentProposalsService', () => {
  let service: AssignmentProposalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignmentProposalsService],
    }).compile();

    service = module.get<AssignmentProposalsService>(
      AssignmentProposalsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
