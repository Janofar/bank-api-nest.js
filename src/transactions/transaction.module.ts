import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './transaction.schema';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TransactionsRepository } from './transaction.repository';
import { AccountModule } from 'src/accounts/account.module';

@Module({
  imports: [
    AccountModule,
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }])
  ],
  controllers: [TransactionController],
  providers: [TransactionService,TransactionsRepository],
  exports: [TransactionService,TransactionsRepository],
})
export class TransactionModule {}
