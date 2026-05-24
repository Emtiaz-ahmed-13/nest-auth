import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { OtpType } from '../type/otpType';

export class GenerateOtpDto {
  @IsNumber()
  userId!: number;

  @IsEnum(OtpType)
  type!: OtpType;
}

export class VerifyOtpDto {
  @IsNumber()
  userId!: number;

  @IsEnum(OtpType)
  type!: OtpType;

  @IsString()
  @IsNotEmpty()
  otp!: string;
}
