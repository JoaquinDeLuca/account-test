import { AccountOperationType } from '../enums';
import { AccountDomain } from './account.domain';
import { BadRequestException } from '@nestjs/common';

describe('AccountDomain.getSignedAmount', () => {
  it('debe devolver monto positivo para DEPOSIT', () => {
    expect(
      AccountDomain.getSignedAmount(100, AccountOperationType.DEPOSIT),
    ).toBe(100);
  });

  it('debe normalizar a positivo aunque venga negativo en DEPOSIT', () => {
    expect(
      AccountDomain.getSignedAmount(-100, AccountOperationType.DEPOSIT),
    ).toBe(100);
  });

  it('debe devolver monto negativo para WITHDRAW', () => {
    expect(
      AccountDomain.getSignedAmount(100, AccountOperationType.WITHDRAW),
    ).toBe(-100);
  });
});

describe('AccountDomain.applyOperation', () => {
  it('debe sumar correctamente en un depósito', () => {
    expect(AccountDomain.applyOperation(100, 50)).toBe(150);
  });

  it('debe restar correctamente en un retiro válido', () => {
    expect(AccountDomain.applyOperation(100, -40)).toBe(60);
  });

  it('debe permitir llegar a saldo 0', () => {
    expect(AccountDomain.applyOperation(10, -10)).toBe(0);
  });

  it('debe lanzar BadRequestException si el saldo quedaría negativo', () => {
    expect(() => AccountDomain.applyOperation(50, -60)).toThrow(
      BadRequestException,
    );
  });
});
