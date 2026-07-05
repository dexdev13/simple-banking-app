import { PrimaryColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { createId } from '@paralleldrive/cuid2';

export abstract class CoreEntity {
  @PrimaryColumn({ type: 'varchar', length: 24 })
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @BeforeInsert()
  protected generateId(): void {
    if (!this.id) {
      this.id = createId();
    }
  }
}
