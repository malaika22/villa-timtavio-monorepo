import { PartialType } from '@nestjs/mapped-types';

import { CreateExperienceCategoryDto } from './create-experience-category.dto';

export class UpdateExperienceCategoryDto extends PartialType(
  CreateExperienceCategoryDto,
) {}
