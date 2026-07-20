import { Test, TestingModule } from '@nestjs/testing';
import { ShiftAssignmentProposalsController } from '../assignment-proposals.controller';

describe('assignment-proposals/AssignmentProposalsController', () => {
  let controller: ShiftAssignmentProposalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftAssignmentProposalsController],
    }).compile();

    controller = module.get<ShiftAssignmentProposalsController>(
      ShiftAssignmentProposalsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
