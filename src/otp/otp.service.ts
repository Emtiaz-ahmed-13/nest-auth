import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createTransport } from 'nodemailer';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Otp } from './entity/otp.entity';

import * as crypto from 'crypto';
import { OtpType } from './type/otpType';

type GenerateOtpResult =
  | { otp: string; expiresAt: Date }
  | { message: string; expiresAt: Date };

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {}

  async generateOTP(userId: number, type: OtpType): Promise<GenerateOtpResult> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    const otpEntity = this.otpRepository.create({
      user,
      token: hashedOtp,
      type,
      expiresAt,
    });

    await this.otpRepository.save(otpEntity);

    if (type === OtpType.RESET_LINK) {
      const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
      const resetLink = `${baseUrl}/reset-password?userId=${user.id}&token=${otp}`;
      await this.sendResetLinkEmail(user.email, resetLink);
      return { message: `Reset link sent to ${user.email}`, expiresAt };
    }

    return { otp, expiresAt };
  }

  private async sendResetLinkEmail(email: string, resetLink: string) {
    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: email,
      subject: 'Password reset link',
      html: `
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link expires in 10 minutes.</p>
      `,
    });
  }

  async verifyOTP(
    userId: number,
    type: OtpType,
    otp: string,
  ): Promise<boolean> {
    const otpEntity = await this.otpRepository.findOne({
      where: { user: { id: userId }, type },
      order: { createdAt: 'DESC' },
    });

    if (!otpEntity) {
      throw new NotFoundException('OTP record not found');
    }

    if (otpEntity.expiresAt < new Date()) {
      return false;
    }

    return bcrypt.compare(otp, otpEntity.token);
  }
}
