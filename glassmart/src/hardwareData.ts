// Hardware fittings catalogue data
// Hardware prices are controlled centrally in the app for now.
export const HARDWARE_MRP = 500;

export type HwVariant = { brands: string[]; sizes: string[]; materials?: string[]; finishes?: string[]; image?: string; };
export type HwCategory = { id: string; name: string; variants: HwVariant[]; };
export type HwGroup = { id: string; name: string; categories: HwCategory[]; };
export type HwBrandCard = { brand: string; sizes: string[]; materials?: string[]; finishes?: string[]; image?: string; };

const img = (group: string, brand: string) => `/images/hardware/${group}/${slug(brand)}.jpg`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const hardwareGroups: HwGroup[] = [
  { id: "hinges-pivots", name: "Hinges & pivots", categories: [
    { id: "hinges", name: "Hinges", variants: [
      { brands: ["Ivas", "KAR"], sizes: ["3\"", "4\"", "5\"", "6\""], materials: ["Stainless steel"], finishes: ["S/S", "Antique"], image: "/images/hardware/hinges/kar.jpg" },
      { brands: ["Jyothi", "KAR Magnum"], sizes: ["3\"", "4\"", "5\"", "6\"", "8\""], materials: ["Brass"], finishes: ["S.S satin", "Antique"] },
    ] },
    { id: "box-hinges", name: "Box hinges", variants: [{ brands: ["Sleek", "Simor", "Hettich", "Ivas", "Green Summet", "Ebco"], sizes: ["6\"", "8\"", "16\""], finishes: ["Soft close"] }] },
  ]},
  { id: "bolts-latches-aldrops", name: "Bolts, latches & aldrops", categories: [
    { id: "tower-bolts", name: "Tower bolts", variants: [
      { brands: ["Jyothi", "Crane"], sizes: ["3\"", "4\"", "6\"", "8\"", "10\"", "12\"", "18\"", "24\""], materials: ["Aluminium"], finishes: ["S.S", "Antique", "Gold", "Bright"] },
      { brands: ["Jyothi", "KAR", "Plus Point"], sizes: ["3\"", "4\"", "6\"", "8\"", "10\"", "12\"+"], materials: ["Brass"], finishes: ["S.S satin", "Antique"] },
    ] },
    { id: "aldrops", name: "Aldrops", variants: [
      { brands: ["Jyothi", "Crane"], sizes: ["8\"", "10\"", "12\""], materials: ["Aluminium"], finishes: ["Bright", "S.S", "Antique", "Gold"] },
      { brands: ["Jai Shankar"], sizes: ["10\"", "12\""], materials: ["Stainless steel"], finishes: ["S/S"] },
      { brands: ["Jyothi", "Plus Point", "Door Safe"], sizes: ["8\"", "10\"", "12\"", "14\"", "18\""], materials: ["Brass"], finishes: ["Antique"] },
    ] },
    { id: "latch", name: "Latch", variants: [{ brands: ["Jyothi", "Crane", "Jai Shankar", "Plus Point", "Door Safe"], sizes: ["10\"", "12\""], materials: ["Aluminium", "Brass", "S/S"], finishes: ["Bright", "S/S", "Antique", "Gold"] }] },
    { id: "baby-latch", name: "Baby latch", variants: [{ brands: ["Jyothi", "Crane", "KAR"], sizes: ["3\"", "4\""], materials: ["Aluminium", "Brass"], finishes: ["Bright", "S/S", "Antique", "Gold"] }] },
  ]},
  { id: "handles-knobs", name: "Handles & knobs", categories: [
    { id: "handle", name: "Handle", variants: [{ brands: ["Jyothi", "Crane", "Jai Shankar", "Plus Point", "Door Safe", "Kolin"], sizes: ["4\"", "5\"", "6\"", "7\"", "8\""], materials: ["Aluminium", "S/S", "Brass"], finishes: ["Bright", "S/S", "Antique", "Gold"] }] },
    { id: "wardrobe-handles-knobs", name: "Wardrobe handles & knobs", variants: [{ brands: ["Simor", "Sifon", "Duster", "Stars", "Tudes", "Level", "Isretik", "Laresh"], sizes: ["96mm", "160mm", "224mm", "256mm", "288mm"] }] },
  ]},
  { id: "stoppers-stays-hooks", name: "Stoppers, stays & hooks", categories: [
    { id: "door-stoppers", name: "Door stoppers", variants: [{ brands: ["Jyothi", "Crane", "Curio", "Door Safe", "Plus Point", "J.K", "Jai Shankar"], sizes: ["3\"", "4\"", "6\"", "8\""], materials: ["Aluminium", "Brass", "S/S"], finishes: ["Bright", "S/S", "Gold", "Antique"] }] },
    { id: "delux-window-stay", name: "Delux window stay", variants: [{ brands: ["Jyothi", "Crane"], sizes: ["6\""], materials: ["Aluminium", "Brass"], finishes: ["Bright", "S/S", "Gold", "Antique"] }] },
    { id: "goat-hooks", name: "Goat hooks", variants: [{ brands: ["Jyothi", "Crane"], sizes: ["4\""], materials: ["Aluminium"], finishes: ["Bright", "Antique", "Gold"] }] },
  ]},
  { id: "sliding-channels", name: "Sliding channels", categories: [{ id: "telescopic-channel", name: "Telescopic channel", variants: [{ brands: ["Ebco"], sizes: ["8\"", "10\"", "12\"", "14\"", "16\"", "18\"", "20\"", "24\""], finishes: ["Regular", "Soft close"] }] }] },
];

export function getBrandCards(category: HwCategory): HwBrandCard[] {
  const cards: HwBrandCard[] = [];
  category.variants.forEach(variant => variant.brands.forEach(brand => cards.push({ brand, sizes: variant.sizes, materials: variant.materials, finishes: variant.finishes, image: variant.image || undefined })));
  return cards;
}
