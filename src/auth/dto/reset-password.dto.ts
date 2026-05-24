import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { OtpType } from '../../otp/type/otpType';

export class ResetPasswordDto {
  @IsNumber()
  userId!: number;

  @IsEnum(OtpType)
  type!: OtpType;

  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;
}
