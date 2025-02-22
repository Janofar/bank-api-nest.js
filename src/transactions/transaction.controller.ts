import { Controller, Post, Get, Body, Param, BadRequestException, NotFoundException, UseGuards, Request, HttpException, HttpStatus, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { AccountsService } from '../accounts/account.service';
import { AuthGuard } from '@nestjs/passport';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiBadRequestResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { TransactionDto, TransactionHistoryDto } from './transaction.dto';


@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly accountsService: AccountsService,
    @InjectConnection() private readonly connection: Connection,
  ) { }

  @Post('credit')
  @UseGuards(AuthGuard('jwt'))
  // @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({
    summary: 'Credit an account',
    description: 'Credits a specified amount to the user’s account and creates a transaction record.'
  })
  @ApiOkResponse({
    description: 'Successfully credited account',
    schema: {
      example: {
        "transactionId": "txn_123456",
        "type": "Credit",
        "amount": 500.00,
        "balanceAfter": 1500.00,
        "timestamp": "2025-02-19T12:00:00Z"
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid amount',
    schema: {
      example: {
        statusCode: 400,
        message: 'Amount must be a valid number greater than zero.',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Transaction could not be created.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Transaction could not be created.',
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Account not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Account not found.',
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
  async credit(@Request() req, @Body() transactionDto: TransactionDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {

      const { amount } = transactionDto;
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new BadRequestException('Amount must be a valid number greater than zero.');
      }

      const userId = req.user?.userId;

      const account = await this.accountsService.getAccount(userId);
      if (!account) {
        throw new NotFoundException('Account not found.');
      }

      await this.accountsService.creditAccount(userId, amount, session);

      const transaction = await this.transactionService.createTransaction({
        userId,
        amount,
        type: 'Credit',
        balance: account.balance,
      }, session);

      if (!transaction) {
        throw new BadRequestException('Transaction could not be created.');
      }
      await session.commitTransaction();
      await session.endSession();
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

  @Post('debit')
  @UseGuards(AuthGuard('jwt'))
  // @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Debit an account',
    description: 'Debits a specified amount from the user’s account and creates a transaction record.'
  })
  @ApiOkResponse({
    description: 'Successfully debited account',
    schema: {
      example: {
        "transactionId": "txn_123456",
        "type": "Debit",
        "amount": 500.00,
        "balanceAfter": 1500.00,
        "timestamp": "2025-02-19T12:00:00Z"
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient balance',
    schema: {
      example: {
        error: 'Insufficient balance',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid amount',
    schema: {
      example: {
        statusCode: 400,
        message: 'Amount must be a valid number greater than zero.',
        error: 'Bad Request',
      },
    },
  })

  @ApiResponse({
    status: 400,
    description: 'Transaction creation failed',
    schema: {
      example: {
        statusCode: 400,
        message: 'Transaction could not be created.',
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Account not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Account not found.',
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
  async debit(@Request() req, @Body() transactionDto: TransactionDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const { amount } = transactionDto;
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

      await this.accountsService.debitAccount(userId, amount, session);

      const transaction = await this.transactionService.createTransaction({
        userId,
        amount,
        type: 'Debit',
        balance: account.balance,
      }, session);

      if (!transaction) {
        throw new BadRequestException('Transaction could not be created.');
      }
      await session.commitTransaction();
      await session.endSession();
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
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter transactions from this date (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter transactions up to this date (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by transaction type (Credit or Debit)',
    enum: ['Credit', 'Debit'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (default: 10)',
    type: Number,
  })
  @ApiOkResponse({
    description: 'Transaction history retrieved successfully',
    schema: {
      example: {
        currentPage: "2",
        totalPages: 3,
        totalTransactions: 6,
        transactions: [
          {
            transactionId: '65d4f9c1e6b4b5f123456789',
            userId: '65d4f9c1e6b4b5f987654321',
            amount: 100,
            type: 'Credit',
            balanceAfter: 500,
            createdAt: '2024-02-21T10:00:00.000Z',
          },
          {
            transactionId: '65d4fae1a8c3b6c876543210',
            userId: '65d4f9c1e6b4b5f987654321',
            amount: 50,
            type: 'Debit',
            balanceAfter: 450,
            createdAt: '2024-02-20T12:30:00.000Z',
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - User must be logged in',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters or request format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid date format for startDate or endDate.',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected error occurred while fetching transactions',
    schema: {
      example: {
        statusCode: 500,
        message: 'Something went wrong',
        error: 'Internal Server Error',
      },
    },
  })
    async getHistory(
    @Request() req,
    @Query() query: TransactionHistoryDto,
  ) {
    const {
      startDate,
      endDate,
      type,
      page = 1,
      limit = 10
    } = query ?? {};

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
