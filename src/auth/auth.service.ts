import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OtpService } from '../otp/otp.service';
import { UserService } from '../user/user.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      await this.userService.incrementFailedLoginAttempts(user);
      return null;
    }

    await this.userService.resetFailedLoginAttempts(user.id);
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    } as any);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    } as any);

    await this.userService.setCurrentRefreshToken(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const user = await this.userService.findById(dto.userId);
    if (!user || !user.currentHashedRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenMatches = await bcrypt.compare(
      dto.refreshToken,
      user.currentHashedRefreshToken,
    );
    if (!tokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    } as any);
    const newRefreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    } as any);
    await this.userService.setCurrentRefreshToken(newRefreshToken, user.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: number) {
    await this.userService.removeRefreshToken(userId);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const matches = await bcrypt.compare(dto.currentPassword, user.password);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.userService.updatePassword(userId, dto.newPassword);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const isValid = await this.otpService.verifyOTP(
      dto.userId,
      dto.type,
      dto.token,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    await this.userService.updatePassword(dto.userId, dto.newPassword);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, dto);
  }
}
