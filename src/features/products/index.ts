export {
  createCategory,
  createProduct,
  deactivateProduct,
  getProduct,
  listActiveProducts,
  listCategories,
  listProducts,
  updateCategory,
  updateProduct,
  updateProductStock,
} from './repository';
export { assertValid, validateCategoryInput, validateProductInput, validateProductPatch } from './validation';
export type * from './types';
