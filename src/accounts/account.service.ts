
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account, AccountDocument } from './account.schema';
import { ClientSession, Model, ObjectId, Types } from 'mongoose';
import { UserDocument } from 'src/users/user.schema';
import { AccountsRepository } from './account.repository';
import  * as dotenv from 'dotenv';

dotenv.config();

const branchCode = process.env.BRANCH_CODE || 'BR123'
const bankCode = process.env.BANK_CODE || '1345'
@Injectable()
export class AccountsService {
    constructor(
        private readonly accountsRepository: AccountsRepository ,
        @InjectModel(Account.name) private accountModel: Model<AccountDocument>
    ) { }

    async createAccountForUser(user : UserDocument, session: ClientSession | null) {
        let accountNumber;
        let isUnique = false;
    
        while (!isUnique) {
            const uniquePart = Math.floor(100000 + Math.random() * 900000);
            accountNumber = `${bankCode}${branchCode}${uniquePart}`;
            const existingAccount = await this.accountModel.findOne({ accountNumber }).session(session);
            if (!existingAccount) {
                isUnique = true;
            }
        }
        return await this.accountsRepository.createAccount({user,accountNumber,bankCode},session)
    }

    async getAccountNumber(userId :  Types.ObjectId){
        const account = await this.accountsRepository.getAccount(userId);
        if (!account) {
            return null;
        }
        const { accountNumber } = account;
        return accountNumber;
    }

    async getAccount(userId : Types.ObjectId){
        const account = await this.accountsRepository.getAccount(userId);
        if (!account) {
            throw new NotFoundException('Account not found');
        }
        return account;
    }

    async getAccountBalance(userId : Types.ObjectId){
        const account = await this.accountsRepository.getAccount(userId);
        if (!account) {
            throw new NotFoundException('Account not found');
        }
        const { balance } = account;
        return balance
    }

    async creditAccount(userId: string, amount: number,session: ClientSession) {
        return await this.accountsRepository.processAccountTransaction({userId,type :'Credit',amount},session)
    }

    async debitAccount(userId: string, amount: number,session : ClientSession) {
        return await this.accountsRepository.processAccountTransaction({userId,type :'Debit',amount},session)
    }
}


