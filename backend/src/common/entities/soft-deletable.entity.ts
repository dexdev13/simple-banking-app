import { DeleteDateColumn } from 'typeorm';
import { CoreEntity } from '@/common/entities/core.entity';

export abstract class SoftDeletableEntity extends CoreEntity {
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt!: Date | null;
}
