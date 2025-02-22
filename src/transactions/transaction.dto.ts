import { IsDateString, IsEnum, IsISO8601, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionDto {
  @ApiProperty({description:'amount', example: '78' })
  amount: number;
}

export class TransactionHistoryDto {
    @IsOptional()
    @IsISO8601()
    startDate?: string;
 
    @IsOptional()
    @IsISO8601()
    endDate?: string;
 
    @IsOptional()
    @IsEnum(['Credit', 'Debit'], { message: 'Transaction type must be Credit or Debit' })
    type?: 'Credit' | 'Debit';
 
    @IsOptional()
    @IsNumber()
    page?: number = 1;
 
    @IsOptional()
    @IsNumber()
    limit?: number = 10;
 }
 