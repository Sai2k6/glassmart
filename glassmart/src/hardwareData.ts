// Hardware fittings catalogue data
export const HARDWARE_MRP = 500;

export type HwVariant = {
  brands: string[];
  sizes: string[];
  materials?: string[];
  finishes?: string[];
  image?: string;
  stock?: number;
  sku?: string;
  price?: number;
};

export type HwCategory = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  variants: HwVariant[];
};

export type HwGroup = {
  id: string;
  name: string;
  categories: HwCategory[];
};

export type HwBrandCard = {
  categoryName: string;
  groupName: string;
  brand: string;
  sizes: string[];
  materials?: string[];
  finishes?: string[];
  image?: string;
  stock: number;
  sku?: string;
  price?: number;
};

export const CORE_CATEGORIES = [
  { id: "hinges", name: "Hinges", icon: "🚪", description: "Heavy duty, soft-close & architectural door hinges" },
  { id: "tower-bolts", name: "Tower Bolts", icon: "🔒", description: "Brass, SS & Aluminium tower bolts for doors & windows" },
  { id: "aldrops", name: "Aldrops", icon: "🗝️", description: "Security aldrops in premium brass, SS & aluminium finishes" },
  { id: "latches", name: "Latches", icon: "🔐", description: "Door & window latch locks for residential & commercial use" },
  { id: "handles", name: "Handles", icon: "✊", description: "Designer pull handles, lever handles & entrance door fittings" },
  { id: "coat-hooks", name: "Coat Hooks", icon: "🪝", description: "Wall mounted coat & robe hooks in various finishes" },
  { id: "baby-latches", name: "Baby Latches", icon: "🛡️", description: "Compact latches for cabinets, windows & light doors" },
  { id: "door-stoppers", name: "Door Stoppers", icon: "🛑", description: "Floor & wall mounted door stoppers and holders" },
  { id: "deluxe-window-stays", name: "Deluxe Window Stays", icon: "🪟", description: "Adjustable casement window stay arms & friction hinges" },
  { id: "wardrobe-handles-knobs", name: "Wardrobe Handles & Knobs", icon: "✨", description: "Cabinet knobs, profile handles & wardrobe pulls" },
  { id: "box-hinges", name: "Box Hinges", icon: "📦", description: "Concealed box hinges & hydraulic cabinet soft-close hinges" },
  { id: "telescope-channels", name: "Telescope Channels", icon: "🗄️", description: "Ball bearing telescopic drawer runners & soft-close channels" },
];

export const ALL_BRANDS = [
  "Jyothi",
  "KAR",
  "Jai Shankar",
  "Ebco",
  "Simor",
  "Duster",
  "Star",
  "Crane",
  "Plus Point",
  "Door Safe",
  "Ivas",
  "Sleek",
  "Hettich",
  "Kolin",
  "Curio",
];

export const ALL_MATERIALS = [
  "Stainless Steel",
  "Brass",
  "Aluminium",
  "Aluminium/Brass",
];

export const ALL_FINISHES = [
  "SS",
  "Bright",
  "Antique",
  "Satin",
  "Matt",
  "Gold",
  "Gloss",
  "Soft close",
];

export const hardwareGroups: HwGroup[] = [
  {
    id: "hinges-pivots",
    name: "Hinges & Pivots",
    categories: [
      {
        id: "hinges",
        name: "Hinges",
        description: "Heavy duty, soft-close & architectural door hinges",
        variants: [
          { brands: ["Ivas", "KAR"], sizes: ["3\"", "4\"", "5\"", "6\""], materials: ["Stainless Steel"], finishes: ["SS", "Antique"], stock: 15 },
          { brands: ["Jyothi", "KAR"], sizes: ["3\"", "4\"", "5\"", "6\"", "8\""], materials: ["Brass"], finishes: ["Satin", "Antique"], stock: 20 },
        ],
      },
      {
        id: "box-hinges",
        name: "Box Hinges",
        description: "Concealed box hinges & hydraulic cabinet soft-close hinges",
        variants: [
          { brands: ["Sleek", "Simor", "Hettich", "Ebco", "Ivas"], sizes: ["6\"", "8\"", "16\""], materials: ["Stainless Steel"], finishes: ["Soft close", "SS"], stock: 12 },
        ],
      },
    ],
  },
  {
    id: "bolts-latches-aldrops",
    name: "Bolts, Latches & Aldrops",
    categories: [
      {
        id: "tower-bolts",
        name: "Tower Bolts",
        description: "Brass, SS & Aluminium tower bolts for doors & windows",
        variants: [
          { brands: ["Jyothi", "Crane"], sizes: ["3\"", "4\"", "6\"", "8\"", "10\"", "12\"", "18\"", "24\""], materials: ["Aluminium"], finishes: ["SS", "Antique", "Gold", "Bright"], stock: 25 },
          { brands: ["Jyothi", "KAR", "Plus Point"], sizes: ["3\"", "4\"", "6\"", "8\"", "10\"", "12\""], materials: ["Brass"], finishes: ["Satin", "Antique"], stock: 18 },
        ],
      },
      {
        id: "aldrops",
        name: "Aldrops",
        description: "Security aldrops in premium brass, SS & aluminium finishes",
        variants: [
          { brands: ["Jyothi", "Crane"], sizes: ["8\"", "10\"", "12\""], materials: ["Aluminium"], finishes: ["Bright", "SS", "Antique", "Gold"], stock: 14 },
          { brands: ["Jai Shankar"], sizes: ["10\"", "12\""], materials: ["Stainless Steel"], finishes: ["SS"], stock: 16 },
          { brands: ["Jyothi", "Plus Point", "Door Safe"], sizes: ["8\"", "10\"", "12\"", "14\"", "18\""], materials: ["Brass"], finishes: ["Antique", "Satin"], stock: 10 },
        ],
      },
      {
        id: "latches",
        name: "Latches",
        description: "Door & window latch locks for residential & commercial use",
        variants: [
          { brands: ["Jyothi", "Crane", "Jai Shankar", "Plus Point", "Door Safe"], sizes: ["10\"", "12\""], materials: ["Aluminium", "Brass", "Stainless Steel"], finishes: ["Bright", "SS", "Antique", "Gold"], stock: 20 },
        ],
      },
      {
        id: "baby-latches",
        name: "Baby Latches",
        description: "Compact latches for cabinets, windows & light doors",
        variants: [
          { brands: ["Jyothi", "Crane", "KAR"], sizes: ["3\"", "4\""], materials: ["Aluminium", "Brass"], finishes: ["Bright", "SS", "Antique", "Gold"], stock: 22 },
        ],
      },
    ],
  },
  {
    id: "handles-knobs",
    name: "Handles & Knobs",
    categories: [
      {
        id: "handles",
        name: "Handles",
        description: "Designer pull handles, lever handles & entrance door fittings",
        variants: [
          { brands: ["Jyothi", "Crane", "Jai Shankar", "Plus Point", "Door Safe", "Kolin"], sizes: ["4\"", "5\"", "6\"", "7\"", "8\""], materials: ["Aluminium", "Stainless Steel", "Brass"], finishes: ["Bright", "SS", "Antique", "Gold"], stock: 30 },
        ],
      },
      {
        id: "wardrobe-handles-knobs",
        name: "Wardrobe Handles & Knobs",
        description: "Cabinet knobs, profile handles & wardrobe pulls",
        variants: [
          { brands: ["Simor", "Duster", "Star", "Ebco"], sizes: ["96mm", "160mm", "224mm", "256mm", "288mm"], materials: ["Aluminium", "Zinc Alloy"], finishes: ["Matt", "Satin", "Gold", "SS"], stock: 28 },
        ],
      },
    ],
  },
  {
    id: "stoppers-stays-hooks",
    name: "Stoppers, Stays & Hooks",
    categories: [
      {
        id: "door-stoppers",
        name: "Door Stoppers",
        description: "Floor & wall mounted door stoppers and holders",
        variants: [
          { brands: ["Jyothi", "Crane", "Curio", "Door Safe", "Plus Point", "Jai Shankar"], sizes: ["3\"", "4\"", "6\"", "8\""], materials: ["Aluminium", "Brass", "Stainless Steel"], finishes: ["Bright", "SS", "Gold", "Antique"], stock: 25 },
        ],
      },
      {
        id: "deluxe-window-stays",
        name: "Deluxe Window Stays",
        description: "Adjustable casement window stay arms & friction hinges",
        variants: [
          { brands: ["Jyothi", "Crane"], sizes: ["6\""], materials: ["Aluminium", "Brass"], finishes: ["Bright", "SS", "Gold", "Antique"], stock: 15 },
        ],
      },
      {
        id: "coat-hooks",
        name: "Coat Hooks",
        description: "Wall mounted coat & robe hooks in various finishes",
        variants: [
          { brands: ["Jyothi", "Crane"], sizes: ["4\""], materials: ["Aluminium"], finishes: ["Bright", "Antique", "Gold"], stock: 35 },
        ],
      },
    ],
  },
  {
    id: "sliding-channels",
    name: "Sliding Channels",
    categories: [
      {
        id: "telescope-channels",
        name: "Telescope Channels",
        description: "Ball bearing telescopic drawer runners & soft-close channels",
        variants: [
          { brands: ["Ebco"], sizes: ["8\"", "10\"", "12\"", "14\"", "16\"", "18\"", "20\"", "24\""], materials: ["Cold Rolled Steel"], finishes: ["Regular", "Soft close"], stock: 40 },
        ],
      },
    ],
  },
];

export function getAllHardwareCards(): HwBrandCard[] {
  const cards: HwBrandCard[] = [];
  hardwareGroups.forEach(group => {
    group.categories.forEach(category => {
      category.variants.forEach(variant => {
        variant.brands.forEach(brand => {
          cards.push({
            categoryName: category.name,
            groupName: group.name,
            brand,
            sizes: variant.sizes,
            materials: variant.materials,
            finishes: variant.finishes,
            image: variant.image,
            stock: variant.stock ?? 10,
            sku: `GM-${brand.substring(0, 3).toUpperCase()}-${category.id.substring(0, 3).toUpperCase()}`,
            price: HARDWARE_MRP,
          });
        });
      });
    });
  });
  return cards;
}

export function getBrandCards(category: HwCategory, groupName: string = "Hardware"): HwBrandCard[] {
  const cards: HwBrandCard[] = [];
  category.variants.forEach(variant =>
    variant.brands.forEach(brand =>
      cards.push({
        categoryName: category.name,
        groupName: groupName,
        brand,
        sizes: variant.sizes,
        materials: variant.materials,
        finishes: variant.finishes,
        image: variant.image || undefined,
        stock: variant.stock ?? 10,
        sku: `GM-${brand.substring(0, 3).toUpperCase()}-${category.id.substring(0, 3).toUpperCase()}`,
        price: HARDWARE_MRP,
      })
    )
  );
  return cards;
}

