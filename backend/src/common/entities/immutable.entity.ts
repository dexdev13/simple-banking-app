import { PrimaryColumn, CreateDateColumn, BeforeInsert } from 'typeorm';
import { createId } from '@paralleldrive/cuid2';

export abstract class ImmutableEntity {
  @PrimaryColumn({ type: 'varchar', length: 24 })
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @BeforeInsert()
  protected generateId(): void {
    if (!this.id) {
      this.id = createId();
    }
  }
}
