import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/audit-log')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles('estate_manager', 'owner')
  list(
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditService.list({ search, action, from, to });
  }
}
