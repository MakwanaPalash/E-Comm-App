import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

export enum LinkType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity('shareable_links')
export class ShareableLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'enum', enum: LinkType })
  type: LinkType;

  @Column({ unique: true })
  token: string;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ default: 0 })
  accessCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
