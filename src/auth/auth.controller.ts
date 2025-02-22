import { Controller, Post, Body, UseGuards, Request, Response, BadRequestException, UnauthorizedException, UsePipes, ValidationPipe, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/user.service';
import { UserDto } from '../users/user.dto';
import { AccountsService } from '../accounts/account.service';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { AuthDto } from './auth.dto';
import { ApiBadRequestResponse, ApiInternalServerErrorResponse, ApiOperation, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import  * as dotenv from 'dotenv';

dotenv.config();
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UsersService,
        private accountsService: AccountsService,
        @InjectConnection() private readonly connection: Connection,
    ) { }

    @Post('login')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({
        status: 200,
        description: 'User logged in successfully',
        schema: {
            example: {
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                userId: '609bda56123456789abcdef0',
                accountNumber: '1234567890',
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Invalid email or password',
        schema: {
            example: {
                statusCode: 401,
                message: 'Invalid email or password',
                error: 'Unauthorized',
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
        schema: {
            example: {
                statusCode: 500,
                message: { error: 'Something went wrong' },
                error: 'Internal Server Error',
            },
        },
    })
    async login(@Body() AuthDto: AuthDto, @Response() res) {
        try {
            const user = await this.authService.validateUser(AuthDto.email, AuthDto.password);
            if (!user) {
                throw new UnauthorizedException('Invalid email or password');
            }

            const accountNumber = await this.accountsService.getAccountNumber(user._id);

            const token = await this.authService.generateJwtToken(user);

            res.cookie('access_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000,
            });
            return res.status(200).json({ token, userId: user._id, accountNumber });

        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            } else {
                throw new HttpException({ error: 'Something went wrong' }, HttpStatus.INTERNAL_SERVER_ERROR);
            }

        }
    }

    @Post('register')
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({
        status: 200,
        description: 'User registered successfully',
        schema: {
            example: {
                message: 'User registered successfully',
                userId: '609bda56123456789abcdef0',
            },
        },
    })
    @ApiBadRequestResponse({
        description: 'Email already in use or validation error',
        schema: {
            example: {
                statusCode: 400,
                message: 'Email already in use',
                error: 'Bad Request',
            },
        },
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
        schema: {
            example: {
                statusCode: 500,
                message: { error: 'Something went wrong' },
                error: 'Internal Server Error',
            },
        },
    })
    async register(@Body() userDto: UserDto) {
        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            const existingUser = await this.userService.findByEmail(userDto.email);
            if (existingUser) {
                throw new BadRequestException('Email already in use');
            }

            const user = await this.userService.createUser(userDto, session);
            if (!user) {
                throw new InternalServerErrorException('Error in registering user');
            }

            const account = await this.accountsService.createAccountForUser(user, session);
            if (!account) {
                throw new InternalServerErrorException('Error in creating account');
            }
            await session.commitTransaction();
            await session.endSession();

            return {
                message: 'User registered successfully',
                userId: user._id
            };

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

}
