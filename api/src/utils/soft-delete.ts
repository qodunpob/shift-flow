import { AuditableEntity } from '@/entities';
import type { EntityTarget } from 'typeorm/common/EntityTarget';
import { EntityManager } from 'typeorm';

export const softDelete =
  (
    Entity: EntityTarget<AuditableEntity>,
    entry: AuditableEntity,
    userId: string,
  ) =>
  async (entityManager: EntityManager) => {
    Object.assign(entry, { updatedBy: userId });
    await entityManager.save(Entity, entry);
    await entityManager.softDelete(Entity, entry.id);
  };
