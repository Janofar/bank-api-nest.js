export interface TransactionData {
    userId : string,
    amount : number,
    type : string,
    balance : number
}

export interface TransactionResponse {
    transactionId: string;
    type: 'Credit' | 'Debit';
    amount: number;
    balanceAfter: number;
    timestamp: Date; 
}
