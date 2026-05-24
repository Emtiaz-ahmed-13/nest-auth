import { Body, Controller, Post } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { User } from './user.entity';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() userDto: UserDto): Promise<User> {
    return this.userService.register(userDto);
  }
}
