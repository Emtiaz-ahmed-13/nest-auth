import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OtpType } from '../type/otpType';

@Entity()
export class Otp {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  user!: User;

  @Column()
  token!: string;

  @Column({ type: 'enum', enum: ['otp', 'reset_link'] })
  type!: OtpType;

  @Column()
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
