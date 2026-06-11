export interface ExperienceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { catalogItems: number };
}

export interface CreateExperienceCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateExperienceCategoryDto
  extends Partial<CreateExperienceCategoryDto> {}
