
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './transaction.schema';
import { TransactionData } from './transaction.types';

@Injectable()
export class TransactionsRepository {
    constructor(@InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>) { }

    async createTransaction(
        {
            userId, amount, type, balance
        }: TransactionData,
        session : ClientSession
    ) : Promise<TransactionDocument>{
        const transaction = new this.transactionModel({
            userId,
            amount,
            type,
            balanceAfterTransaction: balance,
        });

        return await transaction.save({session});
    }

    async getUserTransactions(
        userId: string,
        {
          startDate,
          endDate,
          type,
          page = 1,
          limit = 10,
        }: { startDate?: string; endDate?: string; type?: 'Credit' | 'Debit'; page?: number; limit?: number }
      ) {
    
        const filters: any = { userId : new Types.ObjectId(userId)  };
        if (startDate || endDate) {
          filters.createdAt = {};
          if (startDate) filters.createdAt.$gte = new Date(startDate);
          if (endDate) {
              const end = new Date(endDate);
              end.setUTCHours(23, 59, 59, 999); 
              filters.createdAt = { ...(filters.createdAt || {}), $lte: end };
          }
        }
      
        if (type) {
          filters.type = type;
        }
      
        const skip = (page - 1) * limit;
      
        const [transactions, total] = await Promise.all([
          this.transactionModel.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
          this.transactionModel.countDocuments(filters),
        ]);
      
        return {
          transactions,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalTransactions: total,
        };
      }
      
}


