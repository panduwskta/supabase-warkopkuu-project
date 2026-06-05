import type { LocalCategory, LocalProduct } from '@/lib/db';

export interface CreateCategoryInput {
  storeId: string;
  name: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isSample?: boolean;
}

export type UpdateCategoryInput = Partial<Omit<CreateCategoryInput, 'storeId'>>;

export interface CreateProductInput {
  storeId: string;
  name: string;
  price: number;
  hpp?: number;
  stock?: number;
  unit?: string;
  categoryLocalId?: string;
  categoryRemoteId?: string;
  sku?: string;
  barcode?: string;
  photoUrl?: string;
  isActive?: boolean;
  isSample?: boolean;
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'storeId'>>;

export interface ListProductsOptions {
  includeInactive?: boolean;
  includeDeleted?: boolean;
  categoryLocalId?: string;
  search?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ProductRepositoryResult<T = LocalProduct> {
  data: T;
}

export interface CategoryRepositoryResult<T = LocalCategory> {
  data: T;
}
