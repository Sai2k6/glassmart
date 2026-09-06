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

s = s.replace('hardwareGroups.map', 'hardwareCatalog.map')
s = s.replace('hardwareGroups.find', 'hardwareCatalog.find')

# Restore the full login/register form if a previous patch reduced it to only the heading.
broken_login = '''{page === "login" && <main className="page-container auth-page"><div className="auth-card"><p className="eyebrow">GLASSMART ACCOUNT</p><h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1></div></main>}'''
full_login = '''{page === "login" && <main className="page-container login-page"><div className="login-box"><p className="eyebrow">GLASSMART ACCOUNT</p><h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1>{authMode === "register" && <><input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Full name" autoComplete="name"/><input value={authPhone} onChange={e => setAuthPhone(e.target.value)} placeholder="Phone number" autoComplete="tel"/><div className="account-type-grid"><button type="button" className={`account-type ${accountType === "customer" ? "active" : ""}`} onClick={() => setAccountType("customer")}>Customer</button><button type="button" className={`account-type ${accountType === "carpenter" ? "active" : ""}`} onClick={() => setAccountType("carpenter")}>Carpenter</button></div></>}<form onSubmit={handleAuth}><input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email address" autoComplete="email"/><input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" autoComplete={authMode === "login" ? "current-password" : "new-password"}/>{authMode === "register" && <input type="password" value={authConfirm} onChange={e => setAuthConfirm(e.target.value)} placeholder="Confirm password" autoComplete="new-password"/>}{authError && <p className="form-error">{authError}</p>}<button className="primary-btn full" disabled={authLoading}>{authLoading ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}</button></form><p className="login-switch">{authMode === "login" ? "New to Glassmart?" : "Already have an account?"} <button type="button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}> {authMode === "login" ? "Create account" : "Sign in"}</button></p><p className="login-note">Your account is securely managed through Glassmart authentication.</p></div></main>}'''
if broken_login in s:
    s = s.replace(broken_login, full_login, 1)
elif 'className="login-box"' not in s and '{page === "login"' in s:
    raise SystemExit("Login page exists but could not be safely restored")

# Registration account types: Customer, Carpenter, Interior, Engineer, Architect, Admin.
s = s.replace(
    'const [accountType, setAccountType] = useState<"customer" | "carpenter">("customer");',
    'const [accountType, setAccountType] = useState<"customer" | "carpenter" | "interior" | "engineer" | "architect" | "admin">("customer");'
)
old_account_buttons = '<div className="account-type-grid"><button type="button" className={`account-type ${accountType === "customer" ? "active" : ""}`} onClick={() => setAccountType("customer")}>Customer</button><button type="button" className={`account-type ${accountType === "carpenter" ? "active" : ""}`} onClick={() => setAccountType("carpenter")}>Carpenter</button></div>'
new_account_buttons = '''<div className="account-type-grid">{([['customer', 'Customer'], ['carpenter', 'Carpenter'], ['interior', 'Interior'], ['engineer', 'Engineer'], ['architect', 'Architect'], ['admin', 'Admin']] as const).map(([value, label]) => <button key={value} type="button" className={`account-type ${accountType === value ? "active" : ""}`} onClick={() => setAccountType(value)}>{label}</button>)}</div>'''
if old_account_buttons in s:
    s = s.replace(old_account_buttons, new_account_buttons, 1)
elif "['customer', 'Customer']" not in s:
    raise SystemExit("Account type buttons not found")

app.write_text(s)
print("Hardware Supabase integration, login form, and all account types applied")
