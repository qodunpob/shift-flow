import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentProposalsController } from '../assignment-proposals.controller';

describe('assignment-proposals/AssignmentProposalsController', () => {
  let controller: AssignmentProposalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentProposalsController],
    }).compile();

    controller = module.get<AssignmentProposalsController>(
      AssignmentProposalsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
