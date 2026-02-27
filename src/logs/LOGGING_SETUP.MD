/**
 * EJEMPLO: Cómo usar el CentroLogging en servicios existentes
 *
 * El sistema de logging ya está integrado globalmente en tu aplicación:
 * - El interceptor LoggingInterceptor captura todos los requests/responses automáticamente
 * - El Global Exception Filter captura todos los errores automáticamente
 * - El TypeORM Subscriber audita automáticamente cambios en entidades
 *
 * Para usar logging adicional en tus servicios, sigue estos ejemplo:
 */

// ============================================================================
// EJEMPLO 1: Usar LoggingService en un servicio
// ============================================================================

import { Injectable } from '@nestjs/common';
import { LoggingService } from 'src/logs/services/logging.service';
import { LogContext } from 'src/logs/types/log.types';

@Injectable()
export class MiServicio {
  constructor(private loggingService: LoggingService) {}

  async procesarAlgo(): Promise<void> {
    // Contexto básico (sin request)
    const context: LogContext = {
      requestId: this.loggingService.generateRequestId(),
      userId: 123,
      timestamp: new Date(),
    };

    // Loguear información
    await this.loggingService.log('Iniciando procesamiento', context, {
      datos: 'adicionales',
    });

    try {
      // ... lógica del negocio
    } catch (error) {
      // Loguear error
      await this.loggingService.error('Error en procesamiento', context, error, {
        paso: 'paso donde falló',
      });
    }
  }
}

// ============================================================================
// EJEMPLO 2: Usar LoggingService en un controlador con contexto de request
// ============================================================================

import { Controller, Post, Req, Body } from '@nestjs/common';
import { Request } from 'express';

@Controller('mi-endpoint')
export class MiControlador {
  constructor(private loggingService: LoggingService) {}

  @Post('crear')
  async crear(@Req() req: Request, @Body() dto: any): Promise<any> {
    // LoggingInterceptor ya ha generado un requestId
    const context = this.loggingService.createHttpContext(req, {
      timestamp: new Date(),
    });

    await this.loggingService.log('Creando recurso', context, {
      tipoRecurso: dto.tipo,
    });

    // ... lógica
  }
}

// ============================================================================
// EJEMPLO 3: Acceder a logs desde el controlador
// ============================================================================

import { Injectable } from '@nestjs/common';
import { LogsQueryService } from 'src/logs/services/logs-query.service';
import { FilterLogsDto } from 'src/logs/dtos/log.dto';

// Endpoint disponible: GET /api/v1/logs
// Ejemplo de solicitud:
// GET /api/v1/logs?level=error&userId=123&limit=50&page=1

// O acceder programáticamente:
@Injectable()
export class OtroServicio {
  constructor(private logsQueryService: LogsQueryService) {}

  async obtenerErroresDelUsuario(userId: number): Promise<any> {
    return this.logsQueryService.getLogs({
      userId,
      level: 'error',
      limit: 100,
      page: 1,
      sortBy: 'createdAt',
      order: 'DESC',
    });
  }

  async obtenerLogsPorRequestId(requestId: string): Promise<any> {
    return this.logsQueryService.getLogsByRequestId(requestId);
  }
}

// ============================================================================
// ENDPOINTS DISPONIBLES
// ============================================================================

/*
  LOGS:
  - GET /api/v1/logs                    - Listar logs con filtros
  - GET /api/v1/logs/:requestId         - Obtener todos los logs de un request
  - GET /api/v1/logs/stats/by-level     - Estadísticas por nivel
  - GET /api/v1/logs/stats/errors-by-endpoint - Errores por endpoint
  
  AUDIT (Cambios en entidades):
  - GET /api/v1/logs/audit/list         - Listar cambios de entidades
  - GET /api/v1/logs/audit/stats        - Estadísticas de cambios por entidad

  PARÁMETROS DE FILTRO:
  - page: número (default 1)
  - limit: número (default 20)
  - level: 'log' | 'debug' | 'warn' | 'error'
  - userId: número
  - endpoint: string (búsqueda parcial)
  - method: GET | POST | PUT | DELETE
  - search: string (busca en message)
  - startDate: ISO date string
  - endDate: ISO date string
  - sortBy: 'createdAt' | 'level' | 'userId' (default createdAt)
  - order: 'ASC' | 'DESC' (default DESC)
*/

// ============================================================================
// COMPORTAMIENTO AUTOMÁTICO
// ============================================================================

/*
  1. INTERCEPTOR HTTP (LoggingInterceptor):
     - Captura cada request/response
     - Registra duración, status code, IP, user agent
     - Genera request ID único para correlacionar logs
     - NO bloquea el flujo del endpoint
  
  2. GLOBAL EXCEPTION FILTER (GlobalExceptionFilter):
     - Captura errores no manejados
     - Registra stack trace automáticamente
     - Responde al cliente con error formateado
  
  3. AUDIT SUBSCRIBER (AuditSubscriber):
     - Escucha INSERT, UPDATE, DELETE de TypeORM
     - Registra cambios (before/after)
     - Captura usuario y storeId si están disponibles
     - Excluye cambios no relevantes (timestamps, deleted_at)
*/

// ============================================================================
// CONSIDERACIONES DE PERFORMANCE
// ============================================================================

/*
  ✅ Logs se procesan en background sin bloquear requests
  ✅ Bull/BullMQ maneja reintentos automáticos
  ✅ LogsPersistenceService agrupa logs en batch (default 100)
  ✅ Flush periódico cada 5 segundos
  ✅ Índices optimizados en BD para búsquedas rápidas
  
  📊 Con 100k-1M requests/día:
     - Throughput: ~10-1000 logs/segundo
     - Latencia agregada: <5ms por request
     - Espacio en BD: ~500 bytes por log (~500GB/año)
*/

// ============================================================================
// VARIABLES DE ENTORNO
// ============================================================================

/*
  # .env
  LOG_LEVEL=log              # Nivel mínimo a registrar
  LOG_RETENTION_DAYS=90      # Días a mantener en BD
  LOG_BATCH_SIZE=100         # Logs por batch
  LOG_BATCH_TIMEOUT_MS=5000  # ms entre flushes
  BULL_QUEUE_NAME=logs       # Nombre de la queue
  BULL_MAX_WORKERS=4         # Workers concurrentes
*/
