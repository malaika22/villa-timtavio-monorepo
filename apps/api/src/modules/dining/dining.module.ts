import { Module } from '@nestjs/common';
import { DiningService } from './dining.service';
import { DiningController } from './dining.controller';
import { PusherModule } from '../pusher/pusher.module';

@Module({
  imports: [PusherModule],
  controllers: [DiningController],
  providers: [DiningService],
  exports: [DiningService],
})
export class DiningModule {}
