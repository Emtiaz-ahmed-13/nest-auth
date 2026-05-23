import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is required');
}

@Module({
  imports: [MongooseModule.forRoot(mongoUri), UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
