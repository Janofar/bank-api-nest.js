import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { UserData } from './user.types';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(userData:UserData,session:ClientSession): Promise<UserDocument> {
    const newUser: UserDocument = new this.userModel(userData);
    return newUser.save({session}); 
  }

  async findById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId).lean();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).lean();
  }

  async updateUser(userId: string, updateData: Partial<User>): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
  }

  async deleteUser(userId: string): Promise<any> {
    return this.userModel.findByIdAndDelete(userId).exec();
  }
}
