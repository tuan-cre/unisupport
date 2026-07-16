import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { RolesGuard } from './guards/roles.guard';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [FilesModule],
  controllers: [TicketsController],
  providers: [TicketsService, RolesGuard],
  exports: [TicketsService],
})
export class TicketsModule {}
