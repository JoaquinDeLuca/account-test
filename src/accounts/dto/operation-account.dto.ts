import { IsEnum, IsNotEmpty, IsNumber, NotEquals } from 'class-validator';
import {
  AccountOperationsList,
  AccountOperationType,
} from '../enums/operation-account-type';
import { ApiProperty } from '@nestjs/swagger';

export class OperationAccountDto {
  @ApiProperty({ example: 100, description: 'Monto de la operación' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: 'Amount must be a valid finite number' },
  )
  @IsNotEmpty({ message: 'amount is required' })
  @NotEquals(0, { message: "It can't be 0" })
  amount: number;

  @ApiProperty({
    enum: AccountOperationType,
    example: AccountOperationType.WITHDRAW,
  })
  @IsEnum(AccountOperationType, {
    message: `Properties valid are: ${AccountOperationsList}`,
  })
  @IsNotEmpty({ message: 'Type is required' })
  type: AccountOperationType;
}
