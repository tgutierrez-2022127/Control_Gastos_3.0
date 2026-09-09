import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export const CategoriaGasto = {
  ALIMENTACION: 'Alimentacion',
  TRANSPORTE: 'Transporte',
  SERVICIOS: 'Servicios',
  ENTRETENIMIENTO: 'Entretenimiento',
  SALUD: 'Salud',
  EDUCACION: 'Educacion',
  HOGAR: 'Hogar',
  OTROS: 'Otros',
} as const;

export type CategoriaGastoType = typeof CategoriaGasto[keyof typeof CategoriaGasto];

export const MetodoGasto = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
} as const;

export type MetodoGastoType = typeof MetodoGasto[keyof typeof MetodoGasto];

@Entity('gastos')
export class Gasto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  descripcion!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto!: number;

  @Column({
    type: 'enum',
    enum: CategoriaGasto,
    default: CategoriaGasto.OTROS,
  })
  categoria!: CategoriaGastoType;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({
    type: 'enum',
    enum: MetodoGasto,
    default: MetodoGasto.EFECTIVO,
  })
  metodo!: MetodoGastoType;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
