import { TransactionResponse } from "./transaction.dto";

export function mapTransactionData(transaction): TransactionResponse {
    return {
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      type: transaction.type,
      balanceAfter: transaction.balanceAfterTransaction,
      timestamp: transaction.createdAt,
    };
  }
  