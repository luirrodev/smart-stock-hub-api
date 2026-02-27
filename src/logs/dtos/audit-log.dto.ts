import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditOperation } from '../types/log.types';

export class CreateAuditLogDto {
  @IsString()
  entityName: string;

  @IsString()
  entityId: string;

  @IsEnum(AuditOperation)
  operation: AuditOperation;

  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsNumber()
  @IsOptional()
  storeId?: number;

  @IsObject()
  changes: Record<string, any>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class FilterAuditLogsDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit: number = 20;

  @IsOptional()
  @IsString()
  entityName?: string;

  @IsOptional()
  @IsEnum(AuditOperation)
  operation?: AuditOperation;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'userId' | 'operation' = 'createdAt';

  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';
}

export class AuditLogResponseDto {
  id: number;
  entityName: string;
  entityId: string;
  operation: AuditOperation;
  userId?: number;
  changes: Record<string, any>;
  metadata?: Record<string, any>;
  loggedAt: Date;
}

export class PaginatedAuditLogsResponseDto {
  data: AuditLogResponseDto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
