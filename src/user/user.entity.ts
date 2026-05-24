import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ unique: true })
  email!: string;

  @Exclude()
  @Column()
  password!: string;

  @Column({ default: 'user' })
  role!: string;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  currentHashedRefreshToken?: string | null;

  @Column({ default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: 'timestamp', nullable: true })
  lockoutUntil?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
