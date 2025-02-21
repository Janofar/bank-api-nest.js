import { Controller, Post, UseGuards, Request, Body, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from './account.service';

@Controller('account')
export class AccountController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('balance')
  @UseGuards(AuthGuard('jwt'))
  async getBalance(@Request() req) {
    const account = await this.accountsService.getAccount(req.user.userId);
    const { balance, accountNumber } = account;

    return {
      balance,
      accountNumber
    }
  }
}
