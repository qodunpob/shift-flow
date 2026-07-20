import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  CreateAssignmentProposalDto,
  UpdateAssignmentProposalDto,
} from '@/assignment-proposals/assignment-proposal.dto';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { AuthenticatedUser } from '@/auth/authenticated-request';

@Controller('shifts/:shiftId/assignment-proposals')
export class ShiftAssignmentProposalsController {
  @Post()
  create(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Body() dto: CreateAssignmentProposalDto,
  ) {}
}

@Controller('assignment-proposals')
export class AssignmentProposalsController {
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) shiftId: string,
    @Body() dto: UpdateAssignmentProposalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {}

  @Delete(':id')
  delete(
    @Param('id', ParseUUIDPipe) shiftId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {}

  @Post(':id/accept')
  accept() {}
}
