import { Module } from '@nestjs/common';
import { KnownErrorsController } from './known-errors.controller';
import { KnownErrorsService } from './known-errors.service';

@Module({
  controllers: [KnownErrorsController],
  providers: [KnownErrorsService],
})
export class KnownErrorsModule {}
