import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountController } from './account.controller';
import { AccountsService } from './account.service';
import { Account, AccountSchema } from './account.schema';
import { AccountsRepository } from './account.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }])],
  controllers: [AccountController],
  providers: [AccountsService,AccountsRepository],
  exports: [AccountsService,AccountsRepository],
})
export class AccountModule {}
