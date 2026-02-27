import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between } from 'typeorm';
import { Log } from '../entities/log.entity';
import { AuditLog } from '../entities/audit-log.entity';
import {
  FilterLogsDto,
  PaginatedLogsResponseDto,
  LogResponseDto,
} from '../dtos/log.dto';
import {
  FilterAuditLogsDto,
  PaginatedAuditLogsResponseDto,
  AuditLogResponseDto,
} from '../dtos/audit-log.dto';

@Injectable()
export class LogsQueryService {
  constructor(
    @InjectRepository(Log)
    private logRepo: Repository<Log>,
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
  ) {}

  /**
   * Obtiene logs con filtros opcionales
   */
  async getLogs(filter: FilterLogsDto): Promise<PaginatedLogsResponseDto> {
    const query = this.buildLogQuery(filter);

    const [data, total] = await query
      .orderBy(`log.${filter.sortBy}`, filter.order)
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getManyAndCount();

    const pages = Math.ceil(total / filter.limit);

    return {
      data: data as LogResponseDto[],
      total,
      page: filter.page,
      limit: filter.limit,
      pages,
    };
  }

  /**
   * Obtiene audit logs con filtros opcionales
   */
  async getAuditLogs(
    filter: FilterAuditLogsDto,
  ): Promise<PaginatedAuditLogsResponseDto> {
    const query = this.buildAuditLogQuery(filter);

    const [data, total] = await query
      .orderBy(`auditLog.${filter.sortBy}`, filter.order)
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getManyAndCount();

    const pages = Math.ceil(total / filter.limit);

    return {
      data: data as AuditLogResponseDto[],
      total,
      page: filter.page,
      limit: filter.limit,
      pages,
    };
  }

  /**
   * Obtiene un log completo por request ID
   */
  async getLogsByRequestId(requestId: string): Promise<LogResponseDto[]> {
    const logs = await this.logRepo
      .createQueryBuilder('log')
      .where('log.requestId = :requestId', { requestId })
      .orderBy('log.createdAt', 'ASC')
      .getMany();

    return logs as LogResponseDto[];
  }

  /**
   * Estadísticas: logs por nivel en periodo
   */
  async getLogStatsByLevel(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const stats = await this.logRepo
      .createQueryBuilder('log')
      .select('log.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('log.level')
      .getRawMany();

    const result: Record<string, number> = {};
    stats.forEach((stat) => {
      result[stat.level] = parseInt(stat.count, 10);
    });

    return result;
  }

  /**
   * Estadísticas: errores por endpoint
   */
  async getErrorsByEndpoint(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const errors = await this.logRepo
      .createQueryBuilder('log')
      .select('log.endpoint', 'endpoint')
      .addSelect('COUNT(*)', 'count')
      .where('log.level = :level', { level: 'error' })
      .andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('log.endpoint')
      .orderBy('count', 'DESC')
      .getRawMany();

    const result: Record<string, number> = {};
    errors.forEach((error) => {
      result[error.endpoint] = parseInt(error.count, 10);
    });

    return result;
  }

  /**
   * Estadísticas: cambios por entidad (auditoría)
   */
  async getChangesByEntity(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const changes = await this.auditLogRepo
      .createQueryBuilder('auditLog')
      .select('auditLog.entityName', 'entityName')
      .addSelect('COUNT(*)', 'count')
      .where('auditLog.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('auditLog.entityName')
      .orderBy('count', 'DESC')
      .getRawMany();

    const result: Record<string, number> = {};
    changes.forEach((change) => {
      result[change.entityName] = parseInt(change.count, 10);
    });

    return result;
  }

  /**
   * Construye QueryBuilder con filtros
   */
  private buildLogQuery(filter: FilterLogsDto): SelectQueryBuilder<Log> {
    let query = this.logRepo.createQueryBuilder('log');

    if (filter.level) {
      query = query.andWhere('log.level = :level', { level: filter.level });
    }

    if (filter.userId) {
      query = query.andWhere('log.userId = :userId', { userId: filter.userId });
    }

    if (filter.endpoint) {
      query = query.andWhere('log.endpoint LIKE :endpoint', {
        endpoint: `%${filter.endpoint}%`,
      });
    }

    if (filter.method) {
      query = query.andWhere('log.method = :method', { method: filter.method });
    }

    if (filter.requestId) {
      query = query.andWhere('log.requestId = :requestId', {
        requestId: filter.requestId,
      });
    }

    if (filter.search) {
      query = query.andWhere('log.message LIKE :search', {
        search: `%${filter.search}%`,
      });
    }

    if (filter.startDate && filter.endDate) {
      query = query.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }

    return query;
  }

  /**
   * Construye QueryBuilder con filtros para audit logs
   */
  private buildAuditLogQuery(
    filter: FilterAuditLogsDto,
  ): SelectQueryBuilder<AuditLog> {
    let query = this.auditLogRepo.createQueryBuilder('auditLog');

    if (filter.entityName) {
      query = query.andWhere('auditLog.entityName = :entityName', {
        entityName: filter.entityName,
      });
    }

    if (filter.operation) {
      query = query.andWhere('auditLog.operation = :operation', {
        operation: filter.operation,
      });
    }

    if (filter.userId) {
      query = query.andWhere('auditLog.userId = :userId', {
        userId: filter.userId,
      });
    }

    if (filter.startDate && filter.endDate) {
      query = query.andWhere(
        'auditLog.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: filter.startDate,
          endDate: filter.endDate,
        },
      );
    }

    return query;
  }
}
