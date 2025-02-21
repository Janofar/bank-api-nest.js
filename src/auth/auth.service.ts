import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { UserData, UserProfile } from 'src/users/user.types';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<UserProfile> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...result } = user;
    console.log(result,"result")
    return { ...result, _id: user._id as Types.ObjectId };
  }

  async generateJwtToken(user: any) {
    const payload = { userId: user._id, email: user.email };
    return this.jwtService.sign(payload)
  }

  async register({password,...userValues}:UserData, session: any) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersService.createUser({...userValues,password : hashedPassword},session);
  }
}
