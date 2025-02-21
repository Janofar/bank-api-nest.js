import { Controller, Post, Get, Body, Param, BadRequestException, NotFoundException, UseGuards, Request, HttpException, HttpStatus, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { AccountsService } from '../accounts/account.service';
import { AuthGuard } from '@nestjs/passport';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';


@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly accountsService: AccountsService,
    @InjectConnection() private readonly connection: Connection,
  ) { }

  @Post('credit')
  @UseGuards(AuthGuard('jwt'))
  async credit(@Request() req, @Body('amount') amount: number) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new BadRequestException('Amount must be a valid number greater than zero.');
      }

      const userId = req.user?.userId;

      const account = await this.accountsService.getAccount(userId);
      if (!account) {
        throw new NotFoundException('Account not found.');
      }

      await this.accountsService.creditAccount(userId, amount,session);

      const transaction = await this.transactionService.createTransaction({
        userId,
        amount,
        type: 'Credit',
        balance: account.balance,
      },session);

      if (!transaction) {
        throw new BadRequestException('Transaction could not be created.');
      }

      return transaction;
    } catch (err) {
      await session.abortTransaction();
      await session.endSession();
      if (err instanceof HttpException) {
        throw err;
      }else{
        throw new HttpException({ error: 'Something went wrong' }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

  }
  @Post('debit')
  @UseGuards(AuthGuard('jwt'))
  async debit(@Request() req, @Body('amount') amount: number) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new BadRequestException('Amount must be a valid number greater than zero.');
      }

      const userId = req.user?.userId;

      const account = await this.accountsService.getAccount(userId);
      if (!account) {
        throw new NotFoundException('Account not found.');
      }

      if (account.balance < amount) {
        throw new HttpException({ error: 'Insufficient balance' }, HttpStatus.BAD_REQUEST);
      }

      await this.accountsService.debitAccount(userId, amount,session);

      const transaction = await this.transactionService.createTransaction({
        userId,
        amount,
        type: 'Debit',
        balance: account.balance,
      },session);

      if (!transaction) {
        throw new BadRequestException('Transaction could not be created.');
      }

      return transaction;

    } catch (err) {
      await session.abortTransaction();
      await session.endSession();
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException({ error: 'Something went wrong' }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }


  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  async getHistory(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user?.userId;
    return await this.transactionService.getUserTransactions(userId, {
      startDate,
      endDate,
      type: type as 'Credit' | 'Debit' | undefined,
      page,
      limit
    });
  }

}
