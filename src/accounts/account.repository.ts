
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account, AccountDocument } from './account.schema';
import { ClientSession, Model, Types } from 'mongoose';
import { UserDocument } from 'src/users/user.schema';

const branchCode = process.env.BRANCH_CODE
const bankName = process.env.BANK_NAME
const bankCode = process.env.BANK_CODE
@Injectable()
export class AccountsRepository {
    constructor(@InjectModel(Account.name) private accountModel: Model<AccountDocument>) { }

    async createAccount({user, accountNumber, bankCode}: {user: UserDocument, accountNumber: string, bankCode: string}, session: ClientSession | null) : Promise<AccountDocument>{
        const account = new this.accountModel({
            userId: user._id,
            accountNumber,
            branchCode,
            bankName,
            bankCode,
            balance: 0, 
          });
      
          return account.save({ session });
    }

    async getAccount(userId: string | Types.ObjectId): Promise<AccountDocument | null> {
        const objectUserId = new Types.ObjectId(userId);
        return await this.accountModel.findOne({ userId: objectUserId }).lean();
    }

    async processAccountTransaction({userId ,amount,type}:{userId : string | Types.ObjectId,type : string,amount : number},session : ClientSession) :Promise<AccountDocument>{
        const account = await this.accountModel.findOne({ userId: new Types.ObjectId(userId) });

        if (!account) {
            throw new UnauthorizedException('Account not found');
        }
        const newBalance = type === 'Credit' ? account.balance + amount : account.balance - amount;
        account.balance = newBalance;
        return account.save({session});
    }
}


