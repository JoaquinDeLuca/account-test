import { BadRequestException } from '@nestjs/common';
import { AccountOperationType } from '../enums';

export class AccountDomain {
  static getSignedAmount(amount: number, type: AccountOperationType): number {
    const absoluteAmount = Math.abs(amount);

    return type === AccountOperationType.DEPOSIT
      ? absoluteAmount
      : -absoluteAmount;
  }

  static applyOperation(currentBalance: number, amountChange: number) {
    const newBalance = currentBalance + amountChange;

    //2.Regla de negocio nunca saldo negativo
    if (newBalance < 0) {
      throw new BadRequestException(
        `Insufficient funds. Current: $${currentBalance}, Change: $${amountChange}, Result would be: $${newBalance.toFixed(2)}`,
      );
    }

    return newBalance;
  }
}
