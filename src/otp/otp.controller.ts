import { Body, Controller, Post } from '@nestjs/common';
import { GenerateOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('generate')
  async generate(@Body() body: GenerateOtpDto) {
    return this.otpService.generateOTP(body.userId, body.type);
  }

  @Post('verify')
  async verify(@Body() body: VerifyOtpDto) {
    const valid = await this.otpService.verifyOTP(
      body.userId,
      body.type,
      body.otp,
    );
    return { valid };
  }
}
