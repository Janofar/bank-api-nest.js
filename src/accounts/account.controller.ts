import { Controller, Post, UseGuards, Request, Body, Get, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from './account.service';

@Controller('account')
export class AccountController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('balance')
  @UseGuards(AuthGuard('jwt'))
  async getBalance(@Request() req) {
    try{
      const account = await this.accountsService.getAccount(req.user.userId);
      if(!account){
        throw new NotFoundException('Account not found');
      }
      const { balance, accountNumber } = account;
  
      return {
        balance,
        accountNumber
      }
    }catch(err){
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException({ error: 'Something went wrong' }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
    
  }
}
