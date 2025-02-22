import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Transaction, TransactionDocument } from './transaction.schema';
import { TransactionData } from './transaction.types';
import { TransactionsRepository } from './transaction.repository';
import { mapTransactionData } from './transaction.helper';

@Injectable()
export class TransactionService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>
  ) { }

  async createTransaction({ userId, amount, type, balance}: TransactionData, session: ClientSession,) {
    if (type === 'Debit' && amount > balance) {
      throw new BadRequestException('Insufficient balance.');
    }

    const newBalance = type === 'Credit' ? balance + amount : balance - amount;

    const transaction = this.transactionsRepository.createTransaction({
      userId,
      amount,
      type,
      balance: newBalance,
    }, session)
    return mapTransactionData(transaction)

  }

  async getUserTransactions(
    userId: string,
    params: { startDate?: string; endDate?: string; type?: 'Credit' | 'Debit' ,page ?: number,limit ?:number}
  ) {
    const { transactions, ...paginatedResults } = await this.transactionsRepository.getUserTransactions(userId, params);
    return {
      transactions: transactions.map(mapTransactionData),
      ...paginatedResults
    }
  }

}
