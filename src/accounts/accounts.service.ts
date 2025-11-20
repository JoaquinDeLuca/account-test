import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateAccountDto, OperationAccountDto } from './dto';
import { AccountDomain } from './domain';

@Injectable()
export class AccountsService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    this.logger.log('DB connected');
  }

  private readonly logger = new Logger('AccountService');

  private readonly MAX_RETRIES = 6;
  private readonly MAX_BACKOFF_MS = 400;

  private getBackoffDelay(attempt: number): number {
    const base = attempt * 10; // 0ms, 10ms, 20ms y así ...

    const jitter = Math.random() * 20; // entre 0 - 20ms
    const delay = base + jitter;

    return Math.min(delay, this.MAX_BACKOFF_MS);
  }

  async create(createAccountDto: CreateAccountDto) {
    return await this.account.create({
      data: {
        balance: createAccountDto.initialBalance,
      },
    });
  }

  async findOne(id: string) {
    const foundAccount = await this.account.findUnique({
      where: {
        id,
      },
    });

    if (!foundAccount) {
      throw new NotFoundException(`Account not found id: ${id}`);
    }

    return foundAccount;
  }

  async updateBalance(
    accountId: string,
    operationAccountDto: OperationAccountDto,
  ) {
    const { amount, type } = operationAccountDto;

    // Obtener el monto con signo correcto según "Type" si es un retiro o depósito
    const signedAmount = AccountDomain.getSignedAmount(amount, type);

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const account = await this.findOne(accountId);
        const currentBalance = account.balance;

        // Regla de negocio (no saldo negativo) delegada al dominio
        const newBalance = AccountDomain.applyOperation(
          currentBalance,
          signedAmount,
        );

        // Actulizamos la cuenta con versión
        const result = await this.account.updateMany({
          where: {
            id: accountId,
            version: account.version, // sólo matchea si nadie la cambió
          },
          data: {
            balance: newBalance,
            version: {
              increment: 1,
            },
          },
        });

        // si es "exitosa" devuelvo la cuenta actualizada
        if (result.count === 1) {
          const newVersion = account.version + 1;

          //Registramos esa trasacción
          await this.transaction.create({
            data: {
              accountId,
              type,
              amountChange: signedAmount,
              balance: newBalance,
              version: newVersion,
            },
          });

          return await this.findOne(accountId);
        }

        // Calcular delay exponencial y esperar antes de reintentar
        const delay = this.getBackoffDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }

        if (attempt === this.MAX_RETRIES - 1) {
          throw new InternalServerErrorException(
            'Failed operation after maximum retries',
          );
        }

        const delay = this.getBackoffDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new ConflictException('Conflict updating account balance');
  }

  async listTrasaction(accountId: string) {
    return await this.transaction.findMany({
      where: {
        accountId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
