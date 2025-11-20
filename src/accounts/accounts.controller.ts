import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, OperationAccountDto } from './dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'create account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'list transactions by accountId' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'list transactions by accountId' })
  listTransaction(@Param('id', ParseUUIDPipe) accountId: string) {
    return this.accountsService.listTrasaction(accountId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'get account by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Account found' })
  findOne(@Param('id', ParseUUIDPipe) accountId: string) {
    return this.accountsService.findOne(accountId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Apply operation (deposit/withdraw) to account' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Account updated' })
  @ApiResponse({ status: 200, description: 'Balance updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid amount or insufficient funds',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  update(
    @Param('id', ParseUUIDPipe) accountId: string,
    @Body() OperationAccountDto: OperationAccountDto,
  ) {
    return this.accountsService.updateBalance(accountId, OperationAccountDto);
  }
}
