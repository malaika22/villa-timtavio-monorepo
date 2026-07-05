import { Module } from '@nestjs/common';
import { BreezeWayService } from './breezeway.service';
import { BreezeWayController } from './breezeway.controller';

@Module({
  controllers: [BreezeWayController],
  providers: [BreezeWayService],
  exports: [BreezeWayService],
})
export class BreezeWayModule {}
