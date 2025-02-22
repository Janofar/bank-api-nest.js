import { Controller, Post, UseGuards, Request, Body, Get, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from './account.service';
import { ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('account')
export class AccountController {
  constructor(private readonly accountsService: AccountsService) { }

  @Get('balance')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get account balance', description: 'Retrieves the balance and account number for the authenticated user.' })
  @ApiOkResponse({
    description: 'Successfully retrieved balance',
    schema: {
      example: {
        balance: 5000.75,
        accountNumber: '1234567890'
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Account not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Account not found',
        error: 'Not Found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        error: 'Something went wrong',
      },
    },
  })
  async getBalance(@Request() req) {
    try {
      const account = await this.accountsService.getAccount(req.user.userId);
      if (!account) {
        throw new NotFoundException('Account not found');
      }
      const { balance, accountNumber } = account;

      return {
        balance,
        accountNumber
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException({ error: 'Something went wrong' }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

  }
}
