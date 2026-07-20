import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AssignmentsService } from '@/assignments/assignments.service';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/entities';
import {
  CreateAssignmentDto,
  DeclineAssignmentDto,
} from '@/assignments/assignments.dto';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { AuthenticatedUser } from '@/auth/authenticated-request';

@Controller('shifts/:shiftId/assignments')
export class ShiftAssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Roles([UserRole.MANAGER])
  @Post()
  create(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignments.create(shiftId, dto, user);
  }
}

@Controller('assignments/:id')
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Roles([UserRole.MANAGER])
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignments.remove(id, user);
  }

  @Post('accept')
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignments.accept(id, user);
  }

  @Post('decline')
  decline(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeclineAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignments.decline(id, dto, user);
  }
}
