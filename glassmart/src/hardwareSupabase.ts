import { supabase } from "./lib/supabaseClient";
import type { HwGroup } from "./hardwareData";

export type HardwareVariantRecord = {
  productId: string;
  groupName: string;
  categoryName: string;
  brand: string;
  size: string;
  material: string;
  finish: string;
  stock: number;
  image?: string;
};

export async function loadHardwareCatalogFromSupabase(): Promise<{
  groups: HwGroup[] | null;
  variants: HardwareVariantRecord[];
  error: string | null;
}> {
  const { data: products, error: productsError } = await supabase
    .from("hardware_products")
    .select("id, group_name, category_name, brand, image_url, mrp, active")
    .eq("active", true)
    .order("group_name")
    .order("category_name")
    .order("brand");

  if (productsError) return { groups: null, variants: [], error: productsError.message };
  if (!products?.length) return { groups: null, variants: [], error: "No hardware products found in Supabase." };

  const rows: Array<{ id: string; hardware_product_id: string; size: string; material: string; finish: string; stock: number; active: boolean }> = [];
  const pageSize = 500;

  for (let from = 0; ; from += pageSize) {
    const { data: page, error: variantsError } = await supabase
      .from("hardware_variants")
      .select("id, hardware_product_id, size, material, finish, stock, active")
      .eq("active", true)
      .range(from, from + pageSize - 1);

    if (variantsError) return { groups: null, variants: [], error: variantsError.message };
    rows.push(...(page || []));
    if (!page || page.length < pageSize) break;
  }

  const records: HardwareVariantRecord[] = [];
  const groups = new Map<string, Map<string, HwGroup["categories"][number]>>();

  for (const product of products) {
    const groupMap = groups.get(product.group_name) || new Map();
    groups.set(product.group_name, groupMap);
    const category = groupMap.get(product.category_name) || {
      id: product.category_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: product.category_name,
      variants: [],
    };
    groupMap.set(product.category_name, category);

    const productVariants = rows.filter(v => v.hardware_product_id === product.id);
    const allSizes = [...new Set(productVariants.map(v => v.size))];
    const allMaterials = [...new Set(productVariants.map(v => v.material).filter(v => v !== "Standard"))];
    const allFinishes = [...new Set(productVariants.map(v => v.finish).filter(v => v !== "Standard"))];
    const maxStock = productVariants.length ? Math.max(...productVariants.map(v => Number(v.stock) || 0)) : 0;

    category.variants.push({
      brands: [product.brand],
      sizes: allSizes.length ? allSizes : ["Standard"],
      ...(allMaterials.length ? { materials: allMaterials } : {}),
      ...(allFinishes.length ? { finishes: allFinishes } : {}),
      image: product.image_url || undefined,
      stock: maxStock,
    });

    for (const variant of productVariants) {
      records.push({
        productId: product.id,
        groupName: product.group_name,
        categoryName: product.category_name,
        brand: product.brand,
        size: variant.size,
        material: variant.material,
        finish: variant.finish,
        stock: Number(variant.stock) || 0,
        image: product.image_url || undefined,
      });
    }
  }

  const result: HwGroup[] = [...groups.entries()].map(([groupName, categoryMap]) => ({
    id: groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: groupName,
    categories: [...categoryMap.values()],
  }));

  return { groups: result, variants: records, error: null };
}

export function getHardwareVariantStock(
  variants: HardwareVariantRecord[],
  groupName: string,
  categoryName: string,
  brand: string,
  options: { size: string; material: string; finish: string },
) {
  const match = variants.find(v =>
    v.groupName === groupName &&
    v.categoryName === categoryName &&
    v.brand === brand &&
    v.size === options.size &&
    v.material === options.material &&
    v.finish === options.finish
  );
  return match?.stock ?? 0;
}
