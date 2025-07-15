import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../product/product.entity';

@Entity()
export class Catalog {
  @ApiProperty({ description: 'Unique identifier for the catalog', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Name of the catalog', example: 'Electronics' })
  @Column({ unique: true, name: 'name' })
  name: string;

  @ApiProperty({
    description: 'Description of the catalog',
    example: 'All electronic products',
    required: false,
  })
  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @ApiProperty({
    description:
      'Products in this catalog (only populated when explicitly requested)',
    type: () => [Product],
    required: false,
    nullable: true,
  })
  @OneToMany(() => Product, (product) => product.catalog, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  products: Product[];

  @ApiProperty({ description: 'When the catalog was created' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'When the catalog was last updated' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
