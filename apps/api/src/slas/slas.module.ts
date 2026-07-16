import { Global, Module } from '@nestjs/common';
import { SlasController } from './slas.controller';
import { SlasService } from './slas.service';

@Global()
@Module({
  controllers: [SlasController],
  providers: [SlasService],
  exports: [SlasService],
})
export class SlasModule {}
