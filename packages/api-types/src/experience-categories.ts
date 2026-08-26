export interface ExperienceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  /**
   * Which mark stands in for an experience here that has no photograph.
   *
   * Null renders a neutral one. Chosen rather than derived — "The Fleet" and
   * "Raw Pacific" are the estate's own language and no rule gets to a boat or
   * a wave from them.
   */
  glyph?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { catalogItems: number };
}

export interface CreateExperienceCategoryDto {
  name: string;
  /** Null clears it; undefined leaves whatever is stored alone. */
  glyph?: string | null;
  slug?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateExperienceCategoryDto extends Partial<CreateExperienceCategoryDto> {}
