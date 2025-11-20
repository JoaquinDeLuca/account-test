import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ default: 1000, description: 'saldo inicial' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'maxDecimal: 2',
    },
  )
  @IsNotEmpty({ message: 'initialBalance is required' })
  @IsPositive()
  @Min(0)
  initialBalance: number;
}
