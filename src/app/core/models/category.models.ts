/** Matches backend CategoryDto */
export interface CategoryDto {
  id: string;
  name: string;
  parentId?: string;
  displayName?: string;
}
