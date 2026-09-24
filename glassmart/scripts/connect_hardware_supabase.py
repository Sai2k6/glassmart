from pathlib import Path

app = Path("src/App.tsx")
s = app.read_text()

# Check if App.tsx already contains modern hardware catalog and Supabase integration
if 'loadHardwareCatalogFromSupabase' in s and 'addHardwareToCart' in s:
    print("Hardware Supabase integration already connected and verified.")
    raise SystemExit(0)

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
    if marker in s:
        s = s.replace(marker, loader + marker, 1)

if '    loadHardwareCatalog();' not in s:
    s = s.replace(
        '    loadProducts();\n    supabase.auth.getUser()',
        '    loadProducts();\n    loadHardwareCatalog();\n    supabase.auth.getUser()',
        1,
    )

s = s.replace('hardwareGroups.forEach', 'hardwareCatalog.forEach')

if 'const selectedHardwareStock = (' not in s and '  const addHardwareToCart =' in s:
    marker = '  const addHardwareToCart ='
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
    s = s.replace(marker, helper + marker, 1)

app.write_text(s)
print("Hardware Supabase integration verified.")
