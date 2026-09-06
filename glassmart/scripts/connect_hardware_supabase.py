from pathlib import Path

app = Path("src/App.tsx")
s = app.read_text()

if 'from "./hardwareSupabase"' not in s:
    s = s.replace(
        'import { HARDWARE_MRP, hardwareGroups, getBrandCards, HwBrandCard } from "./hardwareData";',
        'import { HARDWARE_MRP, hardwareGroups, getBrandCards, HwBrandCard } from "./hardwareData";\nimport { getHardwareVariantStock, HardwareVariantRecord, loadHardwareCatalogFromSupabase } from "./hardwareSupabase";'
    )

if 'const [hardwareCatalog, setHardwareCatalog]' not in s:
    s = s.replace(
        '  const [selectedHwOptions, setSelectedHwOptions] = useState({ size: "", material: "", finish: "" });',
        '  const [selectedHwOptions, setSelectedHwOptions] = useState({ size: "", material: "", finish: "" });\n  const [hardwareCatalog, setHardwareCatalog] = useState(hardwareGroups);\n  const [hardwareVariants, setHardwareVariants] = useState<HardwareVariantRecord[]>([]);'
    )

if 'const loadHardwareCatalog = async () =>' not in s:
    marker = '  const loadProfile = async (currentUser: User | null) => {'
    loader = '''  const loadHardwareCatalog = async () => {
    const result = await loadHardwareCatalogFromSupabase();
    if (result.groups?.length) {
      setHardwareCatalog(result.groups);
      setHardwareVariants(result.variants);
    }
  };

'''
    if marker not in s:
        raise SystemExit("Missing loadProfile marker")
    s = s.replace(marker, loader + marker, 1)

if '    loadHardwareCatalog();' not in s:
    s = s.replace(
        '    loadProducts();\n    supabase.auth.getUser()',
        '    loadProducts();\n    loadHardwareCatalog();\n    supabase.auth.getUser()',
        1,
    )

s = s.replace('hardwareGroups.forEach', 'hardwareCatalog.forEach')
s = s.replace('  }, [searchQuery]);', '  }, [searchQuery, hardwareCatalog]);', 1)

if 'const selectedHardwareStock = (' not in s:
    marker = '  const addHardwareToCart = (brand: HwBrandCard, groupName: string, categoryName: string) => {'
    helper = '''  const selectedHardwareStock = (brand: HwBrandCard, groupName: string, categoryName: string) => {
    const hasAllOptions = (!brand.sizes?.length || !!selectedHwOptions.size)
      && (!brand.materials?.length || !!selectedHwOptions.material)
      && (!brand.finishes?.length || !!selectedHwOptions.finish);
    if (!hasAllOptions || hardwareVariants.length === 0) return brand.stock;
    return getHardwareVariantStock(hardwareVariants, groupName, categoryName, brand.brand, {
      size: selectedHwOptions.size || "Standard",
      material: selectedHwOptions.material || "Standard",
      finish: selectedHwOptions.finish || "Standard",
    });
  };

'''
    if marker not in s:
        raise SystemExit("Missing addHardwareToCart marker")
    s = s.replace(marker, helper + marker, 1)

start = s.find('  const addHardwareToCart = (brand: HwBrandCard, groupName: string, categoryName: string) => {')
if start == -1:
    raise SystemExit("Could not locate addHardwareToCart")
end = s.find('\n  const updateQty =', start)
if end == -1:
    raise SystemExit("Could not locate updateQty")

new_fn = '''  const addHardwareToCart = (brand: HwBrandCard, groupName: string, categoryName: string) => {
    if (brand.sizes?.length && !selectedHwOptions.size) return notify("Please select a size.");
    if (brand.materials?.length && !selectedHwOptions.material) return notify("Please select a material.");
    if (brand.finishes?.length && !selectedHwOptions.finish) return notify("Please select a finish.");
    const options = { Size: selectedHwOptions.size || "Standard", Material: selectedHwOptions.material || "Standard", Finish: selectedHwOptions.finish || "Standard" };
    const stock = selectedHardwareStock(brand, groupName, categoryName);
    if (stock <= 0) return notify("This hardware item is out of stock.");
    const key = `hardware:${groupName}:${categoryName}:${brand.brand}:${JSON.stringify(options)}`;
    setCart(current => {
      const existing = current.find(i => i.id === key);
      return existing
        ? current.map(i => i.id === key ? { ...i, quantity: Math.min(i.quantity + 1, stock), stock } : i)
        : [...current, { id: key, name: brand.brand, description: `${categoryName} · ${groupName}`, price: HARDWARE_MRP, quantity: 1, image: brand.image, category: categoryName, kind: "hardware", options, stock }];
    });
    notify(`${brand.brand} added to cart`);
  };'''
s = s[:start] + new_fn + s[end:]

s = s.replace(
    '{hwBrand.stock > 0 ? `In stock · ${hwBrand.stock} available` : "OUT OF STOCK"}',
    '{selectedHardwareStock(hwBrand, hwGroup.name, hwCategory.name) > 0 ? `In stock · ${selectedHardwareStock(hwBrand, hwGroup.name, hwCategory.name)} available` : "OUT OF STOCK"}',
)
s = s.replace(
    'disabled={hwBrand.stock <= 0}',
    'disabled={selectedHardwareStock(hwBrand, hwGroup.name, hwCategory.name) <= 0}',
)
s = s.replace(
    '{hwBrand.stock > 0 ? "Add to Cart" : "Out of Stock"}',
    '{selectedHardwareStock(hwBrand, hwGroup.name, hwCategory.name) > 0 ? "Add to Cart" : "Out of Stock"}',
)

# All hardware navigation/search/rendering should use the Supabase-backed state.
s = s.replace('hardwareGroups.map', 'hardwareCatalog.map')
s = s.replace('hardwareGroups.find', 'hardwareCatalog.find')

app.write_text(s)
print("Hardware Supabase integration applied")
