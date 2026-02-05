import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiModule } from './modules/api.module';
import { SharedModule } from './modules/shared/shared.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { Env } from './modules/shared/constants';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ApiModule,
    SharedModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 2500,
      },
    ]),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: Env.MONGO_URI,
      }),
    }),
  ],
})
export class AppModule {}
