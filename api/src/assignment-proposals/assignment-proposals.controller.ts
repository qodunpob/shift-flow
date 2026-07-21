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
import { UserRole } from '@/entities';
import { Roles } from '@/auth/roles.decorator';
import { AssignmentProposalsService } from '@/assignment-proposals/assignment-proposals.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('assignment-proposals')
@ApiBearerAuth()
@Controller('shifts/:shiftId/assignment-proposals')
export class ShiftAssignmentProposalsController {
  constructor(private readonly proposals: AssignmentProposalsService) {}

  @Roles([UserRole.EMPLOYEE])
  @Post()
  create(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Body() dto: CreateAssignmentProposalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposals.create(shiftId, dto, user);
  }
}

@ApiTags('assignment-proposals')
@ApiBearerAuth()
@Controller('assignment-proposals/:id')
export class AssignmentProposalsController {
  constructor(private readonly proposals: AssignmentProposalsService) {}

  @Roles([UserRole.EMPLOYEE])
  @Put()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssignmentProposalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposals.update(id, dto, user);
  }

  @Roles([UserRole.EMPLOYEE])
  @Delete()
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposals.remove(id, user);
  }

  @Roles([UserRole.MANAGER])
  @Post('accept')
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposals.accept(id, user);
  }

  @Roles([UserRole.MANAGER])
  @Post('decline')
  decline(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.proposals.decline(id, user);
  }
}
