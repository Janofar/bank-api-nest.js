import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountsService } from '../accounts/account.service';
import { AuthGuard } from '@nestjs/passport';
import { CanActivate } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';

describe('AccountController', () => {
  let controller: AccountController;
  let accountsService: Partial<AccountsService>;

  beforeEach(async () => {
    accountsService = {
      getAccount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [{ provide: AccountsService, useValue: accountsService }],
    })
      .overrideGuard(AuthGuard('jwt')) 
      .useValue({
        canActivate: jest.fn(() => true),
      } as CanActivate)
      .compile();

    controller = module.get<AccountController>(AccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return account balance and account number', async () => {
    const mockAccount = { balance: 5000, accountNumber: '1234567890' };
    (accountsService.getAccount as jest.Mock).mockResolvedValue(mockAccount);

    const req = { user: { userId: 'test-user-id' } };

    const result = await controller.getBalance(req);
    expect(result).toEqual(mockAccount);
    expect(accountsService.getAccount).toHaveBeenCalledWith('test-user-id');
  });

  it('should throw NotFoundException if account not found', async () => {
    (accountsService.getAccount as jest.Mock).mockResolvedValue(null);

    const req = { user: { userId: 'test-user-id' } };

    await expect(controller.getBalance(req)).rejects.toThrow(NotFoundException);
  });
});
