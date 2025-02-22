import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/user.service';
import { AccountsService } from '../accounts/account.service';
import { Connection } from 'mongoose';
import { UnauthorizedException, BadRequestException, HttpException, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import { getConnectionToken } from '@nestjs/mongoose';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: Partial<AuthService>;
  let userService: Partial<UsersService>;
  let accountsService: Partial<AccountsService>;
  let mockConnection: Partial<Connection>;

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      generateJwtToken: jest.fn(),
    };

    userService = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };

    accountsService = {
      getAccountNumber: jest.fn(),
      createAccountForUser: jest.fn(),
    };

    mockConnection = {
      startSession: jest.fn().mockReturnValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: userService },
        { provide: AccountsService, useValue: accountsService },
        { provide: getConnectionToken(), useValue: mockConnection },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('Login', () => {
    it('should return a token and account number if credentials are valid', async () => {
      const mockUser = { _id: '123', email: 'valid@example.com' };
      const mockToken = 'mocked-jwt-token';
      const mockAccountNumber = '9876543210';

      if (!authService || !authService.validateUser) {
        throw new Error('authService or validateUser is not defined');
      }
      (authService.validateUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.generateJwtToken as jest.Mock).mockResolvedValue(mockToken);
      (accountsService.getAccountNumber as jest.Mock).mockResolvedValue(mockAccountNumber);

      const mockResponse = {
        cookie: jest.fn(),
      } as any;
    
      const result = await authController.login(
        { email: 'valid@example.com', password: 'password' },
        mockResponse
      );

      expect(authService.validateUser).toHaveBeenCalledWith('valid@example.com', 'password');
      expect(authService.generateJwtToken).toHaveBeenCalledWith(mockUser);
      expect(accountsService.getAccountNumber).toHaveBeenCalledWith(mockUser._id);
      expect(mockResponse.cookie).toHaveBeenCalledWith('access_token', mockToken, expect.any(Object));
    
      expect(result).toEqual({
        token: mockToken,
        userId: mockUser._id,
        accountNumber: mockAccountNumber,
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      const mockResponse = {
        cookie: jest.fn(),
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as any;

      await expect(authController.login({ email: 'invalid@example.com', password: 'wrong' }, mockResponse))
        .rejects.toThrow(UnauthorizedException);

      expect(authService.validateUser).toHaveBeenCalledWith('invalid@example.com', 'wrong');
      expect(mockResponse.cookie).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors and return 500', async () => {
      (authService.validateUser as jest.Mock).mockRejectedValue(new Error('Database error'));

      const mockResponse = {
        cookie: jest.fn(),
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as any;

      await expect(authController.login({ email: 'error@example.com', password: 'password' }, mockResponse))
        .rejects.toThrow(HttpException);

      expect(authService.validateUser).toHaveBeenCalledWith('error@example.com', 'password');
      expect(mockResponse.cookie).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('Register', () => {
    it('should register a new user and return success message', async () => {
      if(!mockConnection || !mockConnection.startSession){
        throw new Error('Connection is not established')
      }
      const mockSession = await mockConnection.startSession();
      const mockUser = { _id: '123', email: 'newuser@example.com' };
      const mockAccount = { accountNumber: '9876543210' };
  
      (userService.findByEmail as jest.Mock).mockResolvedValue(null);
      (userService.createUser as jest.Mock).mockResolvedValue(mockUser);
      (accountsService.createAccountForUser as jest.Mock).mockResolvedValue(mockAccount);
  
      const result = await authController.register({
        name: 'newuser',
        email: 'newuser@example.com',
        password: 'password',
      });
  
      expect(userService.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(userService.createUser).toHaveBeenCalledWith(
        { name: 'newuser', email: 'newuser@example.com', password: 'password' },
        mockSession
      );
      expect(accountsService.createAccountForUser).toHaveBeenCalledWith(mockUser, mockSession);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'User registered successfully',
        userId: '123',
      });
    });
  
    it('should throw BadRequestException if email is already in use', async () => {
      if(!mockConnection || !mockConnection.startSession){
        throw new Error('Connection is not established')
      }
      const mockSession = await mockConnection.startSession();
      (userService.findByEmail as jest.Mock).mockResolvedValue({ _id: '456', email: 'existing@example.com' });
  
      await expect(
        authController.register({ name: 'existing', email: 'existing@example.com', password: 'password' })
      ).rejects.toThrow(BadRequestException);
  
      expect(userService.findByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  
    it('should handle transaction failure and return 500 error', async () => {
      if(!mockConnection || !mockConnection.startSession){
        throw new Error('Connection is not established')
      }
      const mockSession = await mockConnection.startSession();
      (userService.findByEmail as jest.Mock).mockResolvedValue(null);
      (userService.createUser as jest.Mock).mockRejectedValue(new Error('Database error'));
  
      await expect(
        authController.register({ name: 'erroruser', email: 'erroruser@example.com', password: 'password' })
      ).rejects.toThrow(HttpException);
  
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  
    it('should handle unexpected errors and return 500 error', async () => {
      if(!mockConnection || !mockConnection.startSession){
        throw new Error('Connection is not established')
      }
      const mockSession = await mockConnection.startSession();
      (userService.findByEmail as jest.Mock).mockResolvedValue(null);
      (userService.createUser as jest.Mock).mockRejectedValue(new Error('Unexpected error'));
  
      await expect(
        authController.register({ name: 'unexpected', email: 'unexpected@example.com', password: 'password' })
      ).rejects.toThrow(HttpException);
  
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });
});
