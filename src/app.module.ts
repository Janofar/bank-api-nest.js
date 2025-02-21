import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TransactionModule } from './transactions/transaction.module';
import { AccountModule } from './accounts/account.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/bankDB'),
    TransactionModule,  
    AccountModule,
    AuthModule
  ],
})
export class AppModule {}
