import { Injectable, Logger } from '@nestjs/common';
import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  DataSource,
} from 'typeorm';
import * as deepEqual from 'fast-deep-equal';
import { LogsPersistenceService } from '../services/logs-persistence.service';
import { RequestContextService } from '../../common/services/request-context.service';
import { AuditOperation } from '../types/log.types';

const EXCLUDED_ENTITIES = ['Log', 'AuditLog'];

@EventSubscriber()
@Injectable()
export class AuditSubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger(AuditSubscriber.name);

  constructor(
    dataSource: DataSource,
    private readonly logsPersistenceService: LogsPersistenceService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  async afterInsert(event: InsertEvent<any>): Promise<void> {
    const entityName = event.metadata?.name;
    if (!entityName || !event.entity) return;
    if (!this.shouldAudit(entityName)) return;
    this.logger.debug(
      `Auditing INSERT on ${entityName} with ID ${event.entity.id}`,
    );

    try {
      await this.logsPersistenceService.addAuditLogToBuffer({
        entityName,
        entityId: String(event.entity.id),
        operation: AuditOperation.CREATE,
        changes: { after: event.entity },
        userId: this.requestContextService.getUserId(),
        metadata: {
          event: 'INSERT',
          timestamp: new Date(),
          requestId: this.requestContextService.getRequestId(),
        },
      });
    } catch (error) {
      this.logger.error('Error logging INSERT:', error.message || error);
    }
  }

  async afterUpdate(event: UpdateEvent<any>): Promise<void> {
    const entityName = event.metadata?.name;
    if (!entityName || !event.entity || !event.databaseEntity) return;
    if (!this.shouldAudit(entityName)) return;

    const changes = this.detectChanges(event.databaseEntity, event.entity);
    if (Object.keys(changes).length === 0) return;

    try {
      await this.logsPersistenceService.addAuditLogToBuffer({
        entityName,
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
    }
  }

  async afterRemove(event: RemoveEvent<any>): Promise<void> {
    const entityName = event.metadata?.name;
    if (!entityName || !event.entity) return;
    if (!this.shouldAudit(entityName)) return;

    try {
      await this.logsPersistenceService.addAuditLogToBuffer({
        entityName,
        entityId: String(event.entity.id),
        operation: AuditOperation.DELETE,
        changes: { before: event.entity },
        userId: this.requestContextService.getUserId(),
        metadata: {
          event: 'DELETE',
          timestamp: new Date(),
          requestId: this.requestContextService.getRequestId(),
        },
      });
    } catch (error) {
      this.logger.error('Error logging DELETE:', error.message || error);
    }
  }

  /**
   * Usa event.metadata.name (siempre disponible en TypeORM)
   * en lugar de instanceof (no funciona con objetos planos)
   */
  private shouldAudit(entityName: string): boolean {
    return !EXCLUDED_ENTITIES.includes(entityName);
  }

  private detectChanges(before: any, after: any): Record<string, any> {
    const changes: Record<string, any> = {};
    const IGNORED_KEYS = ['createdAt', 'updatedAt', 'deletedAt', 'id'];

    const keys = new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after || {}),
    ]);

    keys.forEach((key) => {
      if (IGNORED_KEYS.includes(key)) return;

      const beforeValue = before?.[key];
      const afterValue = after?.[key];

      if (!deepEqual(beforeValue, afterValue)) {
        changes[key] = { before: beforeValue, after: afterValue };
      }
    });

    return changes;
  }
}
