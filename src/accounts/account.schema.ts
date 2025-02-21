import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;

@Schema()
export class Account {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  accountNumber: string;

  @Prop({ required: true })
  branchCode: string; 

  @Prop({ required: true })
  bankCode: string; 

  @Prop({ required: true })
  bankName: string;

  @Prop({ default: 0 })
  balance: number;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
