import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { UsersRepository } from './user.repository';
import { UserData } from './user.types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository ,
    @InjectModel(User.name) private userModel: Model<UserDocument>
) {}

  async findById(userId: string): Promise<User | null> {
    return this.usersRepository.findById(userId);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmail(email)
  }

  async createUser({password,...userValues}:UserData, session: any) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersRepository.createUser({...userValues,password : hashedPassword},session);
  }

  async updateUser(userId: string, updateData: Partial<User>): Promise<User | null> {
    return this.usersRepository.updateUser(userId,updateData)
  }

  async deleteUser(userId: string): Promise<any> {
    return this.usersRepository.deleteUser(userId)
  }

}
