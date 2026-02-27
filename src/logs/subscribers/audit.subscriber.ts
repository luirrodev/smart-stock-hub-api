import { Injectable, Logger } from '@nestjs/common';
import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  DataSource,
} from 'typeorm';
import deepEqual from 'deep-equal';
import { Log } from '../entities/log.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { LogsPersistenceService } from '../services/logs-persistence.service';
import { RequestContextService } from '../../common/services/request-context.service';
import { AuditOperation } from '../types/log.types';

/**
 * Subscriber que audita automáticamente cambios en entidades
 * Registra CREATE, UPDATE, DELETE en audit_logs
 */
@EventSubscriber()
@Injectable()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(
    dataSource: DataSource,
    private readonly logsPersistenceService: LogsPersistenceService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }
  private logger = new Logger(AuditSubscriber.name);

  /**
   * Registra INSERT
   * El userId se obtiene del contexto HTTP a través de RequestContextService
   */
  async afterInsert(event: InsertEvent<any>): Promise<void> {
    if (event.entity && this.shouldAudit(event.entity)) {
      try {
        await this.logsPersistenceService.addAuditLogToBuffer({
          entityName: event.entity.constructor.name,
          entityId: String(event.entity.id),
          operation: AuditOperation.CREATE,
          changes: {
            after: event.entity,
          },
          userId: this.requestContextService.getUserId(),
          metadata: {
            event: 'INSERT',
            timestamp: new Date(),
            requestId: this.requestContextService.getRequestId(),
          },
        });
      } catch (error) {
        this.logger.error('Error logging INSERT:', error.message || error);
        // No lanzar — permitir que la operación continúe aunque falle el audit
      }
    }
  }

  /**
   * Registra UPDATE
   *
   * ⚠️ event.databaseEntity puede ser undefined si TypeORM no cargó el estado anterior
   * (por ej: con update() en lugar de save()). Se valida antes de procesar.
   */
  async afterUpdate(event: UpdateEvent<any>): Promise<void> {
    // Guardar contra undefined: TypeORM no siempre carga databaseEntity
    if (!event.entity || !event.databaseEntity) return;
    if (!this.shouldAudit(event.entity)) return;

    const changes = this.detectChanges(event.databaseEntity, event.entity);

    if (Object.keys(changes).length > 0) {
      try {
        await this.logsPersistenceService.addAuditLogToBuffer({
          entityName: event.entity.constructor.name,
          entityId: String(event.entity.id),
          operation: AuditOperation.UPDATE,
          changes: {
            before: event.databaseEntity,
            after: event.entity,
            diff: changes,
          },
          userId: this.requestContextService.getUserId(),
          metadata: {
            event: 'UPDATE',
            timestamp: new Date(),
            requestId: this.requestContextService.getRequestId(),
          },
        });
      } catch (error) {
        this.logger.error('Error logging UPDATE:', error.message || error);
        // No lanzar — permitir que la operación continúe aunque falle el audit
      }
    }
  }

  /**
   * Registra DELETE
   */
  async afterRemove(event: RemoveEvent<any>): Promise<void> {
    if (event.entity && this.shouldAudit(event.entity)) {
      try {
        await this.logsPersistenceService.addAuditLogToBuffer({
          entityName: event.entity.constructor.name,
          entityId: String(event.entity.id),
          operation: AuditOperation.DELETE,
          changes: {
            before: event.entity,
          },
          userId: this.requestContextService.getUserId(),
          metadata: {
            event: 'DELETE',
            timestamp: new Date(),
            requestId: this.requestContextService.getRequestId(),
          },
        });
      } catch (error) {
        this.logger.error('Error logging DELETE:', error.message || error);
        // No lanzar — permitir que la operación continúe aunque falle el audit
      }
    }
  }

  /**
   * Determina si una entidad debe ser auditada
   * Compara directamente contra clases (no strings) para evitar regresiones
   * por rename de entidades. Excluye Log y AuditLog para evitar recursión infinita.
   */
  private shouldAudit(entity: any): boolean {
    // Usar instanceof en lugar de nombres en strings
    // Si alguien renombra Log a AppLog, esto sigue funcionando
    return !(entity instanceof Log || entity instanceof AuditLog);
  }

  /**
   * Detecta cambios entre valores antes/después
   *
   * Usa deep-equal (librería) en lugar de JSON.stringify para evitar
   * falsos positivos por orden de keys en objetos anidados.
   * Esto garantiza comparación estructural precisa incluso con JSONB complejos.
   */
  private detectChanges(before: any, after: any): Record<string, any> {
    const changes: Record<string, any> = {};

    const keys = new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after || {}),
    ]);

    keys.forEach((key) => {
      const beforeValue = before?.[key];
      const afterValue = after?.[key];

      // Excluir campos internos
      if (['createdAt', 'updatedAt', 'deletedAt', 'id'].includes(key)) {
        return;
      }

      // Usar deep-equal para comparación robusta (maneja orden de keys)
      if (!deepEqual(beforeValue, afterValue)) {
        changes[key] = {
          before: beforeValue,
          after: afterValue,
        };
      }
    });

    return changes;
  }
}
