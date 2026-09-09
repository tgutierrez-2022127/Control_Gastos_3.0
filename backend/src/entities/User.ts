import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import bcrypt from 'bcryptjs';

export const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER'
} as const;

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 100 })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role!: string;

  @Column({ name: 'full_name', length: 100 })
  fullName!: string;

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  avatar!: string | null;

  @Column({ default: true })
  active!: boolean;

  @Column({
    name: 'last_login',
    type: 'timestamp',
    nullable: true
  })
  lastLogin!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !/^\$2[aby]\$/.test(this.password)) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async comparePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}
