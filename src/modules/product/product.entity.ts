import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Catalog } from '../catalog/catalog.entity';

@Entity()
export class Product {
  @ApiProperty({ description: 'Unique identifier for the product', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Name of the product', example: 'iPhone 16' })
  @Column({ name: 'name', unique: true })
  name: string;

  @ApiProperty({
    description: 'Description of the product',
    example: 'Latest iPhone model',
    required: false,
  })
  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @ApiProperty({ description: 'Price of the product', example: 999.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price' })
  price: number;

  @ApiProperty({ description: 'Stock quantity', example: 50 })
  @Column({ default: 0, name: 'stock_quantity' })
  stockQuantity: number;

  @ApiProperty({
    description: 'Catalog this product belongs to',
    type: () => Catalog,
    required: false,
  })
  @ManyToOne(() => Catalog, (catalog) => catalog.products, {
    nullable: true,
  })
  @JoinColumn({ name: 'catalog_id' })
  catalog: Catalog;

  @ApiProperty({
    description: 'ID of the catalog this product belongs to',
    example: 1,
    required: false,
  })
  @Column({ nullable: true, name: 'catalog_id' })
  catalogId: number;

  @ApiProperty({ description: 'When the product was created' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'When the product was last updated' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
