import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LogsQueryService } from '../services/logs-query.service';
import {
  FilterLogsDto,
  PaginatedLogsResponseDto,
  LogResponseDto,
} from '../dtos/log.dto';
import {
  FilterAuditLogsDto,
  PaginatedAuditLogsResponseDto,
} from '../dtos/audit-log.dto';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/access-control/permissions/guards/permissions.guard';
import { RequirePermissions } from 'src/access-control/permissions/decorators/permissions.decorator';

@ApiTags('Logs')
@ApiBearerAuth()
@UseGuards(JWTAuthGuard, PermissionsGuard)
@Controller({ path: 'logs', version: '1' })
export class LogsController {
  constructor(private logsQueryService: LogsQueryService) {}

  @Get()
  @RequirePermissions('logs:view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener logs con filtros',
    description:
      'Retorna logs paginados con posibilidad de filtrar por nivel, usuario, endpoint, etc.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: ['log', 'debug', 'warn', 'error'],
  })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'endpoint', required: false, type: String })
  @ApiQuery({ name: 'method', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getLogs(
    @Query() filter: FilterLogsDto,
  ): Promise<PaginatedLogsResponseDto> {
    return this.logsQueryService.getLogs(filter);
  }

  @Get(':requestId')
  @RequirePermissions('logs:view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener logs por request ID',
    description: 'Retorna todos los logs asociados a un request específico',
  })
  async getLogsByRequestId(
    @Param('requestId') requestId: string,
  ): Promise<LogResponseDto[]> {
    return this.logsQueryService.getLogsByRequestId(requestId);
  }

  @Get('audit/list')
  @RequirePermissions('logs:view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener audit logs con filtros',
    description: 'Retorna cambios de entidades paginados',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'entityName', required: false, type: String })
  @ApiQuery({
    name: 'operation',
    required: false,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
  })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  async getAuditLogs(
    @Query() filter: FilterAuditLogsDto,
  ): Promise<PaginatedAuditLogsResponseDto> {
    return this.logsQueryService.getAuditLogs(filter);
  }

  @Get('stats/by-level')
  @RequirePermissions('logs:view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Estadísticas de logs por nivel',
    description:
      'Retorna cantidad de logs agrupados por nivel (log, debug, warn, error)',
  })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getLogStatsByLevel(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Record<string, number>> {
    return this.logsQueryService.getLogStatsByLevel(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('stats/errors-by-endpoint')
  @RequirePermissions('logs:view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Estadísticas de errores por endpoint',
    description: 'Retorna cantidad de errores agrupados por endpoint',
  })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getErrorsByEndpoint(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Record<string, number>> {
    return this.logsQueryService.getErrorsByEndpoint(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('audit/stats')
  @RequirePermissions('logs:view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Estadísticas de cambios por entidad',
    description: 'Retorna cantidad de cambios agrupados por nombre de entidad',
  })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getChangesByEntity(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Record<string, number>> {
    return this.logsQueryService.getChangesByEntity(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
