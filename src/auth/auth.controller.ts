import { Controller, Post, Body, UseGuards, Request, Response, BadRequestException, UnauthorizedException, UsePipes, ValidationPipe, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/user.service';
import { UserDto } from '../users/user.dto';
import { AccountsService } from '../accounts/account.service';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { authDto } from './auth.dto';

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
    async login(@Body() authDto: authDto, @Response() res) {
        try {
            const user = await this.authService.validateUser(authDto.email, authDto.password);
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

            return { token, userId: user._id, accountNumber };
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
    async register(@Body() userDto: UserDto) {
        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            const existingUser = await this.userService.findByEmail(userDto.email);
            if (existingUser) {
                throw new BadRequestException('Email already in use');
            }

            const user = await this.authService.register(userDto, session);
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
