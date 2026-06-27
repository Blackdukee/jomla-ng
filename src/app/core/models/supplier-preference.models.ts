export interface SupplierCategoryPreferenceDto {
  categoryId: string;
  categoryName: string;
  minQuantity: number;
}

export interface SavePreferenceRequest {
  categoryId: string;
  minQuantity: number;
}
