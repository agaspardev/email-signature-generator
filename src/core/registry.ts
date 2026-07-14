import type { Category, Variant } from './types.ts';

const categories = new Map<string, Category>();

/** Registers a category. Called once per category module at startup (e.g. from src/templates/*). */
export function registerCategory(category: Category): void {
  if (category.variants.length === 0) {
    throw new Error(`Category "${category.id}" must have at least one variant.`);
  }
  categories.set(category.id, category);
}

export function getCategories(): Category[] {
  return [...categories.values()];
}

export function getCategory(categoryId: string): Category | undefined {
  return categories.get(categoryId);
}

/**
 * Resolves the variant to render. If the category has exactly one variant,
 * `variantId` is optional and no selector UI is needed (spec: "Single-variant category").
 */
export function resolveVariant(categoryId: string, variantId?: string): Variant | undefined {
  const category = categories.get(categoryId);
  if (!category) return undefined;

  if (category.variants.length === 1) {
    return category.variants[0];
  }
  return category.variants.find((v) => v.id === variantId);
}
