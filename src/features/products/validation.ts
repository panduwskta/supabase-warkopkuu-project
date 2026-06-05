import type { CreateCategoryInput, CreateProductInput, UpdateProductInput, ValidationResult } from './types';

function hasText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function validateCategoryInput(input: CreateCategoryInput): ValidationResult {
  const errors: string[] = [];

  if (!hasText(input.storeId)) errors.push('Store ID is required.');
  if (!hasText(input.name)) errors.push('Category name is required.');
  if (input.sortOrder !== undefined && (!Number.isInteger(input.sortOrder) || input.sortOrder < 0)) {
    errors.push('Sort order must be a non-negative integer.');
  }

  return { valid: errors.length === 0, errors };
}

export function validateProductInput(input: CreateProductInput): ValidationResult {
  const errors: string[] = [];

  if (!hasText(input.storeId)) errors.push('Store ID is required.');
  if (!hasText(input.name)) errors.push('Product name is required.');
  if (!isNonNegativeNumber(input.price)) errors.push('Price must be a non-negative number.');
  if (input.hpp !== undefined && !isNonNegativeNumber(input.hpp)) errors.push('HPP must be a non-negative number.');
  if (input.stock !== undefined && !isNonNegativeNumber(input.stock)) errors.push('Stock must be a non-negative number.');
  if (input.unit !== undefined && !hasText(input.unit)) errors.push('Unit cannot be empty when provided.');

  return { valid: errors.length === 0, errors };
}

export function validateProductPatch(input: UpdateProductInput): ValidationResult {
  const errors: string[] = [];

  if (input.name !== undefined && !hasText(input.name)) errors.push('Product name cannot be empty.');
  if (input.price !== undefined && !isNonNegativeNumber(input.price)) errors.push('Price must be a non-negative number.');
  if (input.hpp !== undefined && !isNonNegativeNumber(input.hpp)) errors.push('HPP must be a non-negative number.');
  if (input.stock !== undefined && !isNonNegativeNumber(input.stock)) errors.push('Stock must be a non-negative number.');
  if (input.unit !== undefined && !hasText(input.unit)) errors.push('Unit cannot be empty when provided.');

  return { valid: errors.length === 0, errors };
}

export function assertValid(result: ValidationResult) {
  if (!result.valid) {
    throw new Error(result.errors.join(' '));
  }
}
