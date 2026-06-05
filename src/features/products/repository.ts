import {
  createLocalId,
  createSyncFields,
  nowIso,
  warunginDb,
  type LocalCategory,
  type LocalProduct,
} from '@/lib/db';

import type { CreateCategoryInput, CreateProductInput, ListProductsOptions, UpdateProductInput } from './types';
import { assertValid, validateCategoryInput, validateProductInput, validateProductPatch } from './validation';

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function sortCategories(a: LocalCategory, b: LocalCategory) {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}

function sortProducts(a: LocalProduct, b: LocalProduct) {
  return a.name.localeCompare(b.name);
}

export async function listCategories(storeId: string) {
  const categories = await warunginDb.categories.where({ storeId }).toArray();

  return categories
    .filter((category) => !category.isDeleted && !category.deletedAt)
    .sort(sortCategories);
}

export async function createCategory(input: CreateCategoryInput) {
  assertValid(validateCategoryInput(input));

  const timestamp = nowIso();
  const category = {
    ...createSyncFields(input.storeId, { isSample: input.isSample }),
    localId: createLocalId('category'),
    name: input.name.trim(),
    color: input.color,
    icon: input.icon,
    sortOrder: input.sortOrder ?? 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies LocalCategory;

  await warunginDb.categories.add(category);
  return category;
}

export async function updateCategory(localId: string, patch: Partial<Omit<CreateCategoryInput, 'storeId'>>) {
  const existing = await warunginDb.categories.get(localId);
  if (!existing) throw new Error('Category not found.');

  const updated = {
    ...existing,
    ...patch,
    name: patch.name?.trim() ?? existing.name,
    syncStatus: 'pending',
    updatedAt: nowIso(),
  } satisfies LocalCategory;

  assertValid(validateCategoryInput({ storeId: updated.storeId, name: updated.name, sortOrder: updated.sortOrder }));
  await warunginDb.categories.put(updated);
  return updated;
}

export async function listProducts(storeId: string, options: ListProductsOptions = {}) {
  const products = await warunginDb.products.where({ storeId }).toArray();
  const search = options.search ? normalizeSearch(options.search) : '';

  return products
    .filter((product) => (options.includeDeleted ? true : !product.isDeleted && !product.deletedAt))
    .filter((product) => (options.includeInactive ? true : product.isActive))
    .filter((product) => (options.categoryLocalId ? product.categoryLocalId === options.categoryLocalId : true))
    .filter((product) => (search ? product.name.toLowerCase().includes(search) : true))
    .sort(sortProducts);
}

export async function listActiveProducts(storeId: string) {
  return listProducts(storeId, { includeInactive: false, includeDeleted: false });
}

export async function getProduct(localId: string) {
  return warunginDb.products.get(localId);
}

export async function createProduct(input: CreateProductInput) {
  const normalizedInput = {
    ...input,
    hpp: input.hpp ?? 0,
    stock: input.stock ?? 0,
    unit: input.unit ?? 'pcs',
    isActive: input.isActive ?? true,
  } satisfies CreateProductInput;

  assertValid(validateProductInput(normalizedInput));

  const timestamp = nowIso();
  const product = {
    ...createSyncFields(normalizedInput.storeId, { isSample: normalizedInput.isSample }),
    localId: createLocalId('product'),
    categoryLocalId: normalizedInput.categoryLocalId,
    categoryRemoteId: normalizedInput.categoryRemoteId,
    name: normalizedInput.name.trim(),
    price: normalizedInput.price,
    hpp: normalizedInput.hpp ?? 0,
    stock: normalizedInput.stock ?? 0,
    unit: normalizedInput.unit ?? 'pcs',
    sku: normalizedInput.sku,
    barcode: normalizedInput.barcode,
    photoUrl: normalizedInput.photoUrl,
    isActive: normalizedInput.isActive ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies LocalProduct;

  await warunginDb.products.add(product);
  return product;
}

export async function updateProduct(localId: string, patch: UpdateProductInput) {
  assertValid(validateProductPatch(patch));

  const existing = await warunginDb.products.get(localId);
  if (!existing) throw new Error('Product not found.');

  const updated = {
    ...existing,
    ...patch,
    name: patch.name?.trim() ?? existing.name,
    hpp: patch.hpp ?? existing.hpp ?? 0,
    stock: patch.stock ?? existing.stock ?? 0,
    unit: patch.unit ?? existing.unit ?? 'pcs',
    syncStatus: 'pending',
    updatedAt: nowIso(),
  } satisfies LocalProduct;

  assertValid(
    validateProductInput({
      storeId: updated.storeId,
      name: updated.name,
      price: updated.price,
      hpp: updated.hpp,
      stock: updated.stock,
      unit: updated.unit,
    })
  );

  await warunginDb.products.put(updated);
  return updated;
}

export async function deactivateProduct(localId: string) {
  const existing = await warunginDb.products.get(localId);
  if (!existing) throw new Error('Product not found.');

  const updated = {
    ...existing,
    isActive: false,
    isDeleted: true,
    deletedAt: nowIso(),
    syncStatus: 'pending',
    updatedAt: nowIso(),
  } satisfies LocalProduct;

  await warunginDb.products.put(updated);
  return updated;
}

export async function updateProductStock(localId: string, stock: number) {
  return updateProduct(localId, { stock });
}
