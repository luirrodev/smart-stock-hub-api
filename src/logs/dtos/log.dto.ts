import { IsEnum, IsString, IsNumber, IsOptional, IsDate, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { LogLevel } from '../types/log.types';

export class CreateLogDto {
  @IsString()
  requestId: string;

  @IsEnum(LogLevel)
  level: LogLevel;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  context?: Record<string, any>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  statusCode?: number;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  ip?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsNumber()
  @IsOptional()
  storeId?: number;

  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsString()
  @IsOptional()
  method?: string;

  @IsObject()
  @IsOptional()
  error?: Record<string, any>;
}

export class FilterLogsDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit: number = 20;

  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  search?: string; // Busca en message

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'level' | 'userId' = 'createdAt';

  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';
}

export class LogResponseDto {
  id: number;
  requestId: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
  statusCode?: number;
  duration?: number;
  ip?: string;
  userAgent?: string;
  userId?: number;
  storeId?: number;
  endpoint?: string;
  method?: string;
  error?: Record<string, any>;
  createdAt: Date;
}

export class PaginatedLogsResponseDto {
  data: LogResponseDto[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
