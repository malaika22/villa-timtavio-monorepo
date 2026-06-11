import { Module } from '@nestjs/common';

import { ExperienceCategoriesController } from './experience-categories.controller';
import { ExperienceCategoriesService } from './experience-categories.service';

@Module({
  controllers: [ExperienceCategoriesController],
  providers: [ExperienceCategoriesService],
  exports: [ExperienceCategoriesService],
})
export class ExperienceCategoriesModule {}
