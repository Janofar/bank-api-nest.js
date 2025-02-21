import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { AccountsService } from '../accounts/account.service';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const mockTransactionService = {
    createTransaction: jest.fn(),
    getUserTransactions: jest.fn(),
};

const mockAccountsService = {
    getAccount: jest.fn(),
    creditAccount: jest.fn(),
    debitAccount: jest.fn(),
};

const mockConnection = {
    startSession: jest.fn().mockReturnValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
    }),
};

describe('TransactionController', () => {
    let controller: TransactionController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TransactionController],
            providers: [
                { provide: TransactionService, useValue: mockTransactionService },
                { provide: AccountsService, useValue: mockAccountsService },
                { provide: getConnectionToken(), useValue: mockConnection },
            ],
        })
            .overrideGuard(AuthGuard('jwt'))
            .useValue({
                canActivate: (context: ExecutionContext) => true,
            })
            .compile();

        controller = module.get<TransactionController>(TransactionController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Credit Transaction', () => {
        it('should credit the account and return transaction', async () => {
            const mockUser = { userId: '123' };
            const mockAccount = { balance: 1000 };
            const mockTransaction = { userId: '123', amount: 100, type: 'Credit', balance: 1100 };

            mockAccountsService.getAccount.mockResolvedValue(mockAccount);
            mockAccountsService.creditAccount.mockResolvedValue({});
            mockTransactionService.createTransaction.mockResolvedValue(mockTransaction);

            const result = await controller.credit(
                { user: mockUser },
                100
            );

            expect(result).toEqual(mockTransaction);
            expect(mockAccountsService.creditAccount).toHaveBeenCalledWith('123', 100, expect.anything());
            expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(
                { userId: '123', amount: 100, type: 'Credit', balance: 1000 },
                expect.anything()
            );
        });

        it('should throw error if account not found', async () => {
            mockAccountsService.getAccount.mockResolvedValue(null);

            await expect(controller.credit({ user: { userId: '123' } }, 100))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw error if amount is invalid', async () => {
            await expect(controller.credit({ user: { userId: '123' } }, -50))
                .rejects.toThrow('Amount must be a valid number greater than zero');
        });
    });

    describe('Debit Transaction', () => {
        it('should debit the account if sufficient balance exists', async () => {
            const mockUser = { userId: '123' };
            const mockAccount = { balance: 1000 };
            const mockTransaction = { userId: '123', amount: 100, type: 'Debit', balance: 900 };

            mockAccountsService.getAccount.mockResolvedValue(mockAccount);
            mockAccountsService.debitAccount.mockResolvedValue({});
            mockTransactionService.createTransaction.mockResolvedValue(mockTransaction);

            const result = await controller.debit(
                { user: mockUser },
                100
            );

            expect(result).toEqual(mockTransaction);
            expect(mockAccountsService.debitAccount).toHaveBeenCalledWith('123', 100, expect.anything());
            expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(
                { userId: '123', amount: 100, type: 'Debit', balance: 1000 },
                expect.anything()
            );
        });

        it('should throw error if insufficient balance', async () => {
            mockAccountsService.getAccount.mockResolvedValue({ balance: 50 });

            await expect(controller.debit({ user: { userId: '123' } }, 100))
            .rejects.toMatchObject({
                response: { error: 'Insufficient balance' }, 
                status: 400, 
              });
            
        });
    });
    describe('Transaction History', () => {
        it('should return user transactions', async () => {
            const mockUser = { userId: '123' };
            const mockTransactions = [{ id: 1, amount: 100, type: 'Credit' }];

            mockTransactionService.getUserTransactions.mockResolvedValue(mockTransactions);

            const result = await controller.getHistory({ user: mockUser });

            expect(result).toEqual(mockTransactions);
            expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith('123', {
                startDate: undefined,
                endDate: undefined,
                type: undefined,
                page: undefined,
                limit: undefined,
            });
        });
    });


    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});

