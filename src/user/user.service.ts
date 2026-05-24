import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { UserDto } from './dto/user.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(dto: UserDto): Promise<User> {
    const { email, password, name } = dto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = this.userRepository.create({
      email,
      name,
      password: hashedPassword,
    });

    return this.userRepository.save(newUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async setCurrentRefreshToken(token: string, userId: number) {
    const hashed = await bcrypt.hash(token, 10);
    await this.userRepository.update(userId, {
      currentHashedRefreshToken: hashed,
    });
  }

  async removeRefreshToken(userId: number) {
    await this.userRepository.update(userId, {
      currentHashedRefreshToken: null,
    });
  }

  async updatePassword(userId: number, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, {
      password: hashed,
      currentHashedRefreshToken: null,
    });
  }

  async updateProfile(userId: number, data: Partial<User>) {
    await this.userRepository.update(userId, data);
    return this.findById(userId);
  }

  async verifyEmail(userId: number) {
    await this.userRepository.update(userId, {
      isEmailVerified: true,
    });
  }

  async incrementFailedLoginAttempts(user: User) {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const update: Partial<User> = { failedLoginAttempts: attempts };
    if (attempts >= 5) {
      update.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await this.userRepository.update(user.id, update);
  }

  async resetFailedLoginAttempts(userId: number) {
    await this.userRepository.update(userId, {
      failedLoginAttempts: 0,
      lockoutUntil: null,
    });
  }
}
