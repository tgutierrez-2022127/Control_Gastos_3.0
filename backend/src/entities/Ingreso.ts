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

export const CategoriaIngreso = {
  SALARIO: 'Salario',
  BONO: 'Bono',
  VENTAS: 'Ventas',
  INVERSIONES: 'Inversiones',
  NEGOCIO: 'Negocio',
  REGALO: 'Regalo',
  OTROS: 'Otros',
} as const;

export type CategoriaIngresoType = typeof CategoriaIngreso[keyof typeof CategoriaIngreso];

@Entity('ingresos')
export class Ingreso {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  descripcion!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto!: number;

  @Column({
    type: 'enum',
    enum: CategoriaIngreso,
    default: CategoriaIngreso.OTROS,
  })
  categoria!: CategoriaIngresoType;

  @Column({ type: 'date' })
  fecha!: string;

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
