import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TransactionModule } from './transactions/transaction.module';
import { AccountModule } from './accounts/account.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/bankDB'),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000, 
          limit: 10,
        },
      ],
    }),
    TransactionModule,  
    AccountModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService], 
})
export class AppModule {}
