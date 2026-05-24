import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Otp } from './entity/otp.entity';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Otp])],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
