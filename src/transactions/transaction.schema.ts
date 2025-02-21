import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ unique: true, default: uuidv4 })
  transactionId: string;

  @Prop({ required: true, enum: ['Credit', 'Debit'] }) 
  type: 'Credit' | 'Debit';

  @Prop({ required: true, min: 1 }) 
  amount: number;

  @Prop({ required: true })
  balanceAfterTransaction: number;

  @Prop({ required: true })
  userId: string;

  @Prop()  
  createdAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
