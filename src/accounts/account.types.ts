import { Types } from "mongoose";

export interface accountData {
    userId: Types.ObjectId;
    accountNumber: string;
    branchCode: string;
    bankCode: string;
    bankName: string;
    balance: number;
}