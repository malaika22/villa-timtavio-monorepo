import { Module } from '@nestjs/common';
import { BreezeWayService } from './breezeway.service';

@Module({
  providers: [BreezeWayService],
  exports: [BreezeWayService],
})
export class BreezeWayModule {}
