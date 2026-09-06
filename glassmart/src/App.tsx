import { FormEvent, useEffect, useMemo, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient";
import glassProduct from "./assets/glass-product.jpg";
import { HARDWARE_MRP, hardwareGroups, getBrandCards, HwBrandCard } from "./hardwareData";
import { getHardwareVariantStock, HardwareVariantRecord, loadHardwareCatalogFromSupabase } from "./hardwareSupabase";
import "./App.css";
import AdminDashboard from "./AdminDashboard";

// NOTE: This commit intentionally fixes the search focus issue without changing the existing app behavior.
// The header previously defined inline JSX every render. React can treat recreated component functions as
// different component types, which can remount the search input after each keystroke. Keeping Header stable
// is the robust fix; see the extracted stable header component below.

type Page = "home" | "products" | "product" | "services" | "contact" | "hardware" | "login" | "account" | "cart" | "checkout" | "confirmation" | "orders" | "admin" | "admin-products" | "admin-orders" | "admin-enquiries" | "admin-hardware" | "search";
type Product = { id: number; name: string; description: string; price?: number; offer_price?: number; mrp?: number; stock: number; category: string; image?: string; image_url?: string; created_at?: string };
type CartItem = { id: string; name: string; description?: string; price: number; quantity: number; image?: string; category?: string; kind: "product" | "hardware"; options?: Record<string, string>; stock?: number };
type Order = { id: string; user_id?: string; created_at: string; items: CartItem[]; total: number; status: string; customer_name: string; phone: string; email: string; address: string; city: string; state: string; pin: string };
type Enquiry = { id?: string; name: string; phone: string; email: string; service: string; requirements: string; created_at?: string; status?: string };

const fallbackProduct: Product = { id: 1, name: "Premium Etched Glass Panel", description: "Elegant decorative glass panel designed for modern homes, offices and commercial spaces.", price: 500, mrp: 650, stock: 20, category: "Decorative Glass", image: "/images/products/premium-etched-glass-panel.jpg" };
const PRODUCT_CATEGORIES = ["Decorative Glass", "Partition Glass", "Designer Glass", "Custom Glass"];
const SERVICES = ["Decorative Glass", "Glass Partition", "Custom Glass", "Installation"];
const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function App() {
  const [page, setPage] = useState<Page>("home");
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [cart, setCart] = useState<CartItem[]>(() => JSON.parse(localStorage.getItem("glassmart-cart") || "[]"));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem("glassmart-location") || "Select your location");
  const [showLocation, setShowLocation] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [locationText, setLocationText] = useState("");
  const [locationPin, setLocationPin] = useState("");
  const [toast, setToast] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirm, setAuthConfirm] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [accountType, setAccountType] = useState<"customer" | "carpenter" | "interior" | "engineer" | "architect" | "admin">("customer");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [checkout, setCheckout] = useState({ name: "", email: "", phone: "", address: "", city: "", state: "", pin: "" });
  const [checkoutError, setCheckoutError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [enquiry, setEnquiry] = useState<Enquiry>({ name: "", phone: "", email: "", service: "", requirements: "" });
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [adminProduct, setAdminProduct] = useState({ name: "", description: "", mrp: "", offer_price: "", stock: "", category: "", image_url: "" });
  const [adminMessage, setAdminMessage] = useState("");
  const [hwGroupId, setHwGroupId] = useState<string | null>(null);
  const [hwCategoryId, setHwCategoryId] = useState<string | null>(null);
  const [hwBrandIndex, setHwBrandIndex] = useState<number | null>(null);
  const [selectedHwOptions, setSelectedHwOptions] = useState({ size: "", material: "", finish: "" });
  const [hardwareCatalog, setHardwareCatalog] = useState(hardwareGroups);
  const [hardwareVariants, setHardwareVariants] = useState<HardwareVariantRecord[]>([]);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const navigate = (next: Page) => { setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const goHardwareHome = () => { setHwGroupId(null); setHwCategoryId(null); setHwBrandIndex(null); setSelectedHwOptions({ size: "", material: "", finish: "" }); navigate("hardware"); };

  const loadProducts = async () => {
    setProductsLoading(true); setProductsError("");
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) { setProducts([fallbackProduct]); setProductsError("Products database is unavailable. Showing the editable starter product."); }
    else setProducts(data?.length ? data : [fallbackProduct]);
    setProductsLoading(false);
  };

  const loadHardwareCatalog = async () => {
    const result = await loadHardwareCatalogFromSupabase();
    if (result.groups?.length) {
      setHardwareCatalog(result.groups);
      setHardwareVariants(result.variants);
    }
  };

  const loadProfile = async (currentUser: User | null) => {
    if (!currentUser) { setUserRole(""); return; }
    const { data } = await supabase.from("profiles").select("role").eq("id", currentUser.id).maybeSingle();
    setUserRole(data?.role || "");
  };

  useEffect(() => {
    loadProducts();
    loadHardwareCatalog();
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); loadProfile(data.user); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); loadProfile(session?.user || null); });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { localStorage.setItem("glassmart-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if (user) setCheckout(c => ({ ...c, email: user.email || "", name: String(user.user_metadata?.name || ""), phone: String(user.user_metadata?.phone || "") })); }, [user]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || [p.name, p.description, p.category].some(v => String(v || "").toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  }), [products, categoryFilter, searchQuery]);

  const addToCart = (p: Product, options?: Record<string, string>) => {
    const price = Number(p.offer_price ?? p.price ?? p.mrp ?? 0);
    if (p.stock <= 0) return notify("This product is out of stock.");
    setCart(current => { const key = `${p.id}:${JSON.stringify(options || {})}`; const existing = current.find(i => i.id === key); return existing ? current.map(i => i.id === key ? { ...i, quantity: Math.min(i.quantity + 1, p.stock) } : i) : [...current, { id: key, name: p.name, description: p.description, price, quantity: 1, image: p.image_url || p.image, category: p.category, kind: "product", options, stock: p.stock }]; });
    notify(`${p.name} added to cart`);
  };
  const selectedHardwareStock = (brand: HwBrandCard, groupName: string, categoryName: string) => {
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

  const addHardwareToCart = (brand: HwBrandCard, groupName: string, categoryName: string) => {
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
  };
  const updateQty = (id: string, delta: number) => setCart(c => c.map(i => {
    if (i.id !== id) return i;
    const maxStock = Number.isFinite(i.stock) && Number(i.stock) > 0 ? Number(i.stock) : Infinity;
    return { ...i, quantity: Math.min(maxStock, Math.max(0, i.quantity + delta)) };
  }).filter(i => i.quantity > 0));
  const removeItem = (id: string) => { setCart(c => c.filter(i => i.id !== id)); notify("Item removed from cart"); };
  const clearCart = () => { setCart([]); notify("Cart cleared"); };

  const runSearch = () => {
    if (!searchQuery.trim()) return;
    navigate("search");
  };
  const searchHardware = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [] as { group: string; category: string; brand: HwBrandCard }[];
    const terms = query.split(/\s+/).filter(Boolean);
    const out: { group: string; category: string; brand: HwBrandCard }[] = [];
    hardwareCatalog.forEach(g => g.categories.forEach(c => getBrandCards(c).forEach(b => {
      const haystack = [g.name, c.name, b.brand, ...(b.sizes || []), ...(b.materials || []), ...(b.finishes || [])].join(" ").toLowerCase();
      if (terms.every(term => haystack.includes(term))) out.push({ group: g.name, category: c.name, brand: b });
    })));
    return out;
  }, [searchQuery, hardwareCatalog]);

  const handleAuth = async (e?: FormEvent) => {
    e?.preventDefault(); setAuthError("");
    if (!authEmail || !authPassword) return setAuthError("Email and password are required.");
    if (authMode === "register") {
      if (!authName || !authPhone) return setAuthError("Name and phone are required.");
      if (authPassword.length < 6) return setAuthError("Password must be at least 6 characters.");
      if (authPassword !== authConfirm) return setAuthError("Passwords do not match.");
    }
    setAuthLoading(true);
    if (authMode === "register") {
      const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { name: authName, phone: authPhone, account_type: accountType } } });
      if (error) setAuthError(error.message);
      else if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({ id: data.user.id, email: authEmail, role: accountType === "admin" ? "customer" : accountType, points: 0 });
        if (profileError) setAuthError(`Account created, but profile setup needs attention: ${profileError.message}`);
        else { notify(accountType === "admin" ? "Account created. Admin access requires approval." : "Account created. Check your email if verification is enabled."); setAuthMode("login"); setAuthPassword(""); setAuthConfirm(""); }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) setAuthError(error.message);
      else { await loadProfile(data.user); notify("Login successful"); navigate("home"); }
    }
    setAuthLoading(false);
  };
  const logout = async () => { await supabase.auth.signOut(); setUser(null); setUserRole(""); notify("Logged out"); navigate("home"); };

  const selectLocation = (value: string) => { const clean = value.trim(); if (!clean) return; setSelectedLocation(clean); localStorage.setItem("glassmart-location", clean); setShowLocation(false); notify("Delivery location saved"); };
  const useBrowserLocation = () => navigator.geolocation?.getCurrentPosition(pos => selectLocation(`Location ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`), () => notify("Location permission was denied or unavailable."));

  const submitEnquiry = async (e: FormEvent) => {
    e.preventDefault(); setEnquiryLoading(true); setEnquiryMessage("");
    if (!enquiry.name || !enquiry.phone || !enquiry.email || !enquiry.service || !enquiry.requirements) { setEnquiryMessage("Please complete all fields."); setEnquiryLoading(false); return; }
    const { error } = await supabase.from("enquiries").insert(enquiry);
    if (error) { setEnquiryMessage(`Could not save the enquiry: ${error.message}`); } else { setEnquiryMessage("Enquiry submitted successfully. Our team can now follow up."); setEnquiry({ name: "", phone: "", email: "", service: "", requirements: "" }); }
    setEnquiryLoading(false);
  };

  const loadOrders = async () => {
    if (!user) { navigate("login"); return; }
    setOrdersLoading(true);
    const { data, error } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (!error && data) setOrders(data as Order[]);
    else if (error) notify(`Orders could not be loaded: ${error.message}`);
    setOrdersLoading(false);
  };
  const placeOrder = async (e: FormEvent) => {
    e.preventDefault(); setCheckoutError("");
    if (!user) return navigate("login");
    if (!cart.length) return setCheckoutError("Your cart is empty.");
    if (Object.values(checkout).some(v => !v.trim())) return setCheckoutError("Please complete every required delivery field.");
    setPlacingOrder(true);
    const orderPayload = { user_id: user.id, items: cart, total: cartTotal, status: "Order placed", customer_name: checkout.name, phone: checkout.phone, email: checkout.email, address: checkout.address, city: checkout.city, state: checkout.state, pin: checkout.pin };
    const { data, error } = await supabase.from("orders").insert(orderPayload).select().single();
    if (error) { setCheckoutError(`Order could not be placed: ${error.message}`); setPlacingOrder(false); return; }
    const created = data as Order; setLastOrder(created); setCart([]); setPlacingOrder(false); navigate("confirmation");
  };
  const saveAdminProduct = async (e: FormEvent) => {
    e.preventDefault(); setAdminMessage("");
    if (!adminProduct.name || !adminProduct.category) return setAdminMessage("Name and category are required.");
    const payload = { name: adminProduct.name, description: adminProduct.description, mrp: Number(adminProduct.mrp) || 0, offer_price: Number(adminProduct.offer_price) || 0, stock: Number(adminProduct.stock) || 0, category: adminProduct.category, image_url: adminProduct.image_url || null };
    const query = editingProduct ? supabase.from("products").update(payload).eq("id", editingProduct.id).select().single() : supabase.from("products").insert(payload).select().single();
    const { data, error } = await query;
    if (error) return setAdminMessage(error.message);
    setProducts(current => editingProduct ? current.map(p => p.id === editingProduct.id ? data as Product : p) : [data as Product, ...current]);
    setAdminProducts(current => editingProduct ? current.map(p => p.id === editingProduct.id ? data as Product : p) : [data as Product, ...current]);
    setEditingProduct(null); setShowProductForm(false); setAdminMessage("Product saved successfully.");
    setAdminProduct({ name: "", description: "", mrp: "", offer_price: "", stock: "", category: "", image_url: "" });
  };
  const deleteAdminProduct = async (p: Product) => { if (!window.confirm(`Delete ${p.name}?`)) return; const { error } = await supabase.from("products").delete().eq("id", p.id); if (error) setAdminMessage(error.message); else { setProducts(c => c.filter(x => x.id !== p.id)); setAdminProducts(c => c.filter(x => x.id !== p.id)); notify("Product deleted"); } };
  const openEdit = (p: Product) => { setEditingProduct(p); setAdminProduct({ name: p.name, description: p.description, mrp: String(p.mrp ?? ""), offer_price: String(p.offer_price ?? p.price ?? ""), stock: String(p.stock), category: p.category, image_url: p.image_url || p.image || "" }); setShowProductForm(true); };

  const hwGroup = hardwareCatalog.find(g => g.id === hwGroupId) || null;
  const hwCategory = hwGroup?.categories.find(c => c.id === hwCategoryId) || null;
  const hwBrands = hwCategory ? getBrandCards(hwCategory) : [];
  const hwBrand = hwBrandIndex === null ? null : hwBrands[hwBrandIndex] || null;

  const Header = () => null;
  const renderHeader = () => <>
    <header className="navbar">
      <button className="logo" onClick={() => navigate(userRole === "admin" ? "admin" : "home")}><span>GLASS</span>MART<small>Premium Glass Solutions</small></button>
      {userRole !== "admin" && <button className="delivery-location" onClick={() => setShowLocation(true)}><span>📍</span><span><small>Deliver to</small><strong>{selectedLocation}</strong></span></button>}
      {userRole !== "admin" && <div className="search-container"><select className="search-category" value={searchCategory} onChange={e => setSearchCategory(e.target.value)}><option>All</option><option>Hardware</option></select><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); runSearch(); } }} placeholder="Search Hardware..." className="search-input" autoComplete="off"/><button className="search-button" type="button" onClick={runSearch}>⌕</button></div>}
      <div className="nav-right"><button className="language-btn">🇮🇳 EN</button><button className="account-btn" onClick={() => user ? navigate("account") : navigate("login")}><small>Hello</small><strong>{user ? "Account & Lists" : "Login"}</strong></button><button className="orders-btn" onClick={() => { if (!user) navigate("login"); else { loadOrders(); navigate("orders"); } }}><small>Returns</small><strong>& Orders</strong></button>{userRole !== "admin" && <button className="cart-btn" onClick={() => navigate("cart")}><span>🛒</span><strong>Cart</strong>{cartCount > 0 && <b className="cart-count">{cartCount}</b>}</button>}</div>
    </header>
    {userRole !== "admin" && <nav className="main-nav"><button className="nav-category" onClick={() => setShowCategories(v => !v)}>☰ <span>All Categories</span></button><div className="nav-menu"><button className={`nav-button ${page === "home" ? "active" : ""}`} onClick={() => navigate("home")}>Home</button><button className={`nav-button ${page === "hardware" ? "active" : ""}`} onClick={goHardwareHome}>Hardware Fittings</button><button className={`nav-button ${page === "services" ? "active" : ""}`} onClick={() => navigate("services")}>Services</button><button className={`nav-button ${page === "contact" ? "active" : ""}`} onClick={() => navigate("contact")}>Contact</button></div></nav>}
    {showCategories && <div className="category-menu"><button onClick={() => { setShowCategories(false); goHardwareHome(); }}>Hardware Fittings</button><button onClick={() => { setShowCategories(false); navigate("services"); }}>Services</button><button onClick={() => { setShowCategories(false); navigate("contact"); }}>Contact</button></div>}
  </>;

  const ProductCard = ({ p }: { p: Product }) => <article className="product-card"><button className="product-image" onClick={() => { setSelectedProduct(p); navigate("product"); }}>{p.image_url || p.image ? <img src={p.image_url || p.image} alt={p.name} onError={e => { e.currentTarget.style.display = "none"; }} /> : <span>GLASSMART</span>}</button><div className="product-info"><p className="product-category">{p.category || "Glass"}</p><h3>{p.name}</h3><p className="product-description">{p.description || "Premium quality glass product."}</p><div className="product-pricing">{p.offer_price !== undefined ? <><strong>{money(p.offer_price)}</strong>{p.mrp ? <del>{money(p.mrp)}</del> : null}</> : p.price !== undefined ? <strong>{money(p.price)}</strong> : <span>Request quote</span>}</div><p className={p.stock > 0 ? "product-stock" : "product-stock out"}>{p.stock > 0 ? `${p.stock} available` : "Out of stock"}</p><div className="card-actions"><button className="secondary-btn" onClick={() => { setSelectedProduct(p); navigate("product"); }}>View Details</button><button className="primary-btn" disabled={p.stock <= 0} onClick={() => addToCart(p)}>{p.stock > 0 ? "Add to Cart" : "Out of Stock"}</button></div></div></article>;

  return <div className="app">{renderHeader()}
    {showLocation && <div className="modal-backdrop" onClick={() => setShowLocation(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowLocation(false)}>×</button><p className="eyebrow">DELIVERY LOCATION</p><h2>Where should we deliver?</h2><input value={locationText} onChange={e => setLocationText(e.target.value)} placeholder="City / location"/><input value={locationPin} onChange={e => setLocationPin(e.target.value)} placeholder="PIN / postal code"/><div className="modal-actions"><button className="secondary-btn" onClick={useBrowserLocation}>Use my location</button><button className="primary-btn" onClick={() => selectLocation(locationText ? `${locationText}${locationPin ? `, ${locationPin}` : ""}` : locationPin)}>Save location</button></div></div></div>}

    {page === "home" && <main><section className="hero"><div className="hero-content"><p className="eyebrow">HARDWARE FITTINGS</p><h1>Hardware that makes<br/><span>spaces work beautifully.</span></h1><p className="hero-text">Browse our hardware fittings catalogue by group, category, brand, size, material and finish.</p><div className="hero-buttons"><button className="primary-btn" onClick={goHardwareHome}>Explore Hardware →</button><button className="secondary-btn" onClick={() => navigate("services")}>Request a Quote</button></div></div><div className="hero-visual"><div className="glass-card"><img src={glassProduct} alt="Glassmart hardware fittings"/><div className="glass-overlay"><p>GLASSMART</p><h3>HARDWARE<br/>FITTINGS</h3></div></div></div></section><section className="section"><div className="section-heading"><p className="eyebrow">CATALOGUE</p><h2>Hardware Fittings</h2><p>Five main groups, with detailed category and brand drill-down.</p></div><div className="category-grid">{hardwareCatalog.map(g => <button className="category-card" key={g.id} onClick={() => { setHwGroupId(g.id); setHwCategoryId(null); setHwBrandIndex(null); navigate("hardware"); }}><div className="category-icon">⚙</div><h3>{g.name}</h3><p>{g.categories.length} {g.categories.length === 1 ? "category" : "categories"}</p><span>Browse →</span></button>)}</div></section><section className="about"><div><p className="eyebrow">ABOUT GLASSMART</p><h2>Hardware for modern spaces.</h2></div><p>Explore door, window, wardrobe and sliding hardware with sizes, materials, finishes and brand-level details before adding items to your cart.</p></section></main>}
    {page === "products" && <main className="page-container"><div className="page-title"><p className="eyebrow">CATALOGUE MOVED</p><h1>Glass products are currently hidden</h1><p>Glass product browsing is paused for now. Use the Hardware Fittings catalogue instead.</p></div><button className="primary-btn" onClick={goHardwareHome}>Open Hardware Fittings →</button></main>}
    {page === "product" && <main className="page-container"><div className="page-title"><p className="eyebrow">CATALOGUE MOVED</p><h1>This product section is currently hidden</h1><p>Hardware fittings are the active catalogue right now.</p></div><button className="primary-btn" onClick={goHardwareHome}>Open Hardware Fittings →</button></main>}
    {page === "search" && <main className="page-container"><div className="page-title"><p className="eyebrow">HARDWARE SEARCH</p><h1>Results for “{searchQuery}”</h1><p>Search works across hardware groups, categories, brands, sizes, materials and finishes.</p></div>{searchHardware.length ? <div className="hw-grid">{searchHardware.map((r, i) => <button className="hw-card" key={`${r.group}-${r.category}-${r.brand.brand}-${i}`} onClick={() => { const g = hardwareCatalog.find(x => x.name === r.group); const c = g?.categories.find(x => x.name === r.category); setHwGroupId(g?.id || null); setHwCategoryId(c?.id || null); setHwBrandIndex(c ? getBrandCards(c).findIndex(b => b.brand === r.brand.brand && b.image === r.brand.image) : null); navigate("hardware"); }}><span className="hw-card-name">{r.brand.brand}</span><span className="hw-card-meta">{r.group} / {r.category}</span><span className="hw-card-arrow">→</span></button>)}</div> : <div className="empty-state"><div>⌕</div><h2>No hardware matches found.</h2><p>Try a brand, category, size, material, finish or group name.</p></div>}</main>}
    {page === "hardware" && <main className="page-container hw-page"><div className="hw-heading"><p className="hw-eyebrow">HARDWARE FITTINGS CATALOGUE</p><h1>Hardware fittings catalog</h1><p className="hw-count">12 categories · 5 groups</p></div>{!hwGroup && <div className="hw-grid hw-grid-groups">{hardwareCatalog.map(g => <button className="hw-card hw-group-card" key={g.id} onClick={() => { setHwGroupId(g.id); setHwCategoryId(null); setHwBrandIndex(null); }}><span className="hw-card-name">{g.name}</span><span className="hw-card-meta">{g.categories.length} {g.categories.length === 1 ? "category" : "categories"}</span><span className="hw-card-arrow">→</span></button>)}</div>}{hwGroup && !hwCategory && <div className="hw-level"><button className="hw-back-btn" onClick={() => setHwGroupId(null)}>← Back</button><div className="hw-crumb">{hwGroup.name}</div><div className="hw-grid">{hwGroup.categories.map(c => <button className="hw-card" key={c.id} onClick={() => setHwCategoryId(c.id)}><span className="hw-card-name">{c.name}</span><span className="hw-card-arrow">→</span></button>)}</div></div>}{hwGroup && hwCategory && !hwBrand && <div className="hw-level"><button className="hw-back-btn" onClick={() => setHwCategoryId(null)}>← Back</button><div className="hw-crumb">{hwGroup.name} <span>/</span> {hwCategory.name}</div><div className="hw-grid">{hwBrands.map((b, i) => <button className="hw-card hw-brand-card" key={`${b.brand}-${i}`} onClick={() => { setHwBrandIndex(i); setSelectedHwOptions({ size: "", material: "", finish: "" }); }}>{b.image ? <img className="hw-card-image" src={b.image} alt="" onError={e => { e.currentTarget.style.display = "none"; }}/> : null}<span className="hw-card-name">{b.brand}</span><span className="hw-card-arrow">→</span></button>)}</div></div>}{hwGroup && hwCategory && hwBrand && <div className="hw-level"><button className="hw-back-btn" onClick={() => setHwBrandIndex(null)}>← Back</button><div className="hw-crumb">{hwGroup.name} <span>/</span> {hwCategory.name} <span>/</span> {hwBrand.brand}</div><div className="hw-detail-card">{hwBrand.image ? <div className="hw-detail-image"><img src={hwBrand.image} alt={hwBrand.brand} onError={e => { e.currentTarget.style.display = "none"; }}/></div> : null}<div><h2>{hwBrand.brand}</h2>{hwBrand.sizes?.length ? <div className="hw-detail-section"><p className="hw-detail-label">Available sizes</p><div className="hw-chips">{hwBrand.sizes.map(s => <button type="button" className={`hw-chip hw-chip-size hw-chip-option ${selectedHwOptions.size === s ? "selected" : ""}`} key={s} onClick={() => setSelectedHwOptions(o => ({ ...o, size: s }))}>{s}</button>)}</div></div> : null}{hwBrand.materials?.length ? <div className="hw-detail-section"><p className="hw-detail-label">Material type</p><div className="hw-chips">{hwBrand.materials.map(s => <button type="button" className={`hw-chip hw-chip-material hw-chip-option ${selectedHwOptions.material === s ? "selected" : ""}`} key={s} onClick={() => setSelectedHwOptions(o => ({ ...o, material: s }))}>{s}</button>)}</div></div> : null}{hwBrand.finishes?.length ? <div className="hw-detail-section"><p className="hw-detail-label">Finish</p><div className="hw-chips">{hwBrand.finishes.map(s => <button type="button" className={`hw-chip hw-chip-finish hw-chip-option ${selectedHwOptions.finish === s ? "selected" : ""}`} key={s} onClick={() => setSelectedHwOptions(o => ({ ...o, finish: s }))}>{s}</button>)}</div></div> : null}<div className="hw-stock-status">{selectedHardwareStock(hwBrand, hwGroup.name, hwCategory.name) > 0 ? `In stock · ${selectedHardwareStock(hwBrand, hwGroup.name, hwCategory.name)} available` : "OUT OF STOCK"}</div><div className="hw-price"><strong>MRP {money(HARDWARE_MRP)}</strong></div><button className="primary-btn" disabled={selectedHardwareStock(hwBrand, hwGroup.name, hwCategory.name) <= 0} onClick={() => addHardwareToCart(hwBrand, hwGroup.name, hwCategory.name)}>{selectedHardwareStock(hwBrand, hwGroup.name, hwCategory.name) > 0 ? "Add to Cart" : "Out of Stock"}</button></div></div></div>}</main>}
    {page === "cart" && <main className="page-container"><div className="page-title"><p className="eyebrow">YOUR SHOPPING CART</p><h1>Cart</h1></div>{!cart.length ? <div className="empty-state"><div>🛒</div><h2>Your cart is empty</h2><p>Add a hardware fitting to get started.</p><button className="primary-btn" onClick={goHardwareHome}>Browse Hardware Fittings</button></div> : <div className="cart-layout"><div>{cart.map(i => <div className="cart-item" key={i.id}><div className="cart-thumb">{i.image ? <img src={i.image} alt="" onError={e => { e.currentTarget.style.display = "none"; }}/> : <span>HARDWARE</span>}</div><div className="cart-product-info"><p className="product-category">{i.category}</p><h2>{i.name}</h2>{i.options && Object.entries(i.options).map(([k, v]) => <small key={k}>{k}: {v}</small>)}<p>{money(i.price)} each</p><div className="quantity"><button onClick={() => updateQty(i.id, -1)}>−</button><span>{i.quantity}</span><button disabled={i.quantity >= Number(i.stock || Infinity)} onClick={() => updateQty(i.id, 1)}>+</button></div><button className="text-btn" onClick={() => removeItem(i.id)}>Remove</button></div><strong>{money(i.price * i.quantity)}</strong></div>)}</div><aside className="summary"><h2>Order Summary</h2><div className="summary-row"><span>Subtotal</span><span>{money(cartTotal)}</span></div><div className="summary-row"><span>Delivery</span><span>Calculated at order processing</span></div><hr/><div className="summary-total"><span>Total</span><strong>{money(cartTotal)}</strong></div><button className="primary-btn full" onClick={() => user ? navigate("checkout") : navigate("login")}>Proceed to Checkout →</button><button className="secondary-btn full" onClick={clearCart}>Clear Cart</button></aside></div>}</main>}
    {page === "checkout" && <main className="page-container"><div className="page-title"><p className="eyebrow">CHECKOUT</p><h1>Complete Your Order</h1></div>{!cart.length ? <div className="empty-state"><h2>Your cart is empty.</h2><button className="primary-btn" onClick={goHardwareHome}>Browse Hardware Fittings</button></div> : <form className="checkout-layout" onSubmit={placeOrder}><div className="checkout-form"><h2>Customer Details</h2>{([["name","Name"],["email","Email"],["phone","Phone"],["address","Delivery Address"],["city","City"],["state","State"],["pin","PIN code"]] as [keyof typeof checkout,string][]).map(([key,label]) => key === "address" ? <label key={key}>{label}<textarea required value={checkout[key]} onChange={e => setCheckout(c => ({ ...c, [key]: e.target.value }))}/></label> : <label key={key}>{label}<input required value={checkout[key]} onChange={e => setCheckout(c => ({ ...c, [key]: e.target.value }))}/></label>)}{checkoutError && <p className="form-error">{checkoutError}</p>}<button className="primary-btn full" disabled={placingOrder}>{placingOrder ? "Placing order..." : "Place Order"}</button></div><aside className="summary"><h2>Order Summary</h2>{cart.map(i => <div className="summary-row" key={i.id}><span>{i.name} × {i.quantity}</span><span>{money(i.price * i.quantity)}</span></div>)}<hr/><div className="summary-total"><span>Total</span><strong>{money(cartTotal)}</strong></div></aside></form>}</main>}
    {page === "confirmation" && <main className="page-container"><div className="confirmation-card"><p className="eyebrow">ORDER CONFIRMED</p><h1>Thank you for your order.</h1><p>Your order has been placed successfully.</p>{lastOrder && <div className="confirmation-summary"><strong>Order ID</strong><span>{lastOrder.id}</span><strong>Total</strong><span>{money(lastOrder.total)}</span></div>}<button className="primary-btn" onClick={() => user ? (loadOrders(), navigate("orders")) : goHardwareHome()}>View Orders</button></div></main>}
    {page === "orders" && <main className="page-container"><div className="page-title"><p className="eyebrow">ORDER HISTORY</p><h1>Your Orders</h1></div>{ordersLoading ? <div className="loading-state">Loading orders...</div> : !orders.length ? <div className="empty-state"><h2>No orders yet.</h2><button className="primary-btn" onClick={goHardwareHome}>Browse Hardware Fittings</button></div> : <div className="orders-list">{orders.map(o => <article className="order-card" key={o.id}><div><p className="eyebrow">ORDER</p><h2>{o.id}</h2><p>{new Date(o.created_at).toLocaleString("en-IN")}</p></div><strong>{money(o.total)}</strong><span>{o.status}</span><div>{(o.items || []).map(i => <div key={i.id}><span>{i.name} × {i.quantity}</span>{i.options && Object.entries(i.options).map(([k,v]) => <small key={k}>{k}: {v}</small>)}</div>)}</div></article>)}</div>}</main>}
    {page === "services" && <main className="page-container"><div className="page-title"><p className="eyebrow">SERVICES</p><h1>Glass & fitting services</h1><p>Project support, custom requirements and installation assistance for homes and commercial spaces.</p></div><div className="service-grid">{SERVICES.map(s => <article className="service-card" key={s}><h2>{s}</h2><p>Tell us what you need and the team can help you plan the right solution.</p></article>)}</div><div className="contact-panel"><h2>Need something custom?</h2><button className="primary-btn" onClick={() => navigate("contact")}>Send an enquiry →</button></div></main>}
    {page === "contact" && <main className="page-container"><div className="page-title"><p className="eyebrow">CONTACT</p><h1>Let's build something beautiful.</h1><p>Reach Glassmart for hardware requirements, project enquiries and support.</p></div><div className="contact-grid"><div className="contact-card"><p className="eyebrow">PHONE</p><h2>+91 XXXXX XXXXX</h2><p>Call us for product and project support.</p></div><div className="contact-card"><p className="eyebrow">EMAIL</p><h2>hello@glassmart.in</h2><p>Send us your requirement and we will follow up.</p></div><div className="contact-card"><p className="eyebrow">LOCATION</p><h2>{selectedLocation}</h2><p>Use the delivery location selector in the header.</p></div></div></main>}
    {page === "login" && <main className="page-container login-page"><div className="login-box"><p className="eyebrow">GLASSMART ACCOUNT</p><h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1>{authMode === "register" && <><input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Full name" autoComplete="name"/><input value={authPhone} onChange={e => setAuthPhone(e.target.value)} placeholder="Phone number" autoComplete="tel"/><div className="account-type-grid">{([['customer', 'Customer'], ['carpenter', 'Carpenter'], ['interior', 'Interior'], ['engineer', 'Engineer'], ['architect', 'Architect'], ['admin', 'Admin']] as const).map(([value, label]) => <button key={value} type="button" className={`account-type ${accountType === value ? "active" : ""}`} onClick={() => setAccountType(value)}>{label}</button>)}</div></>}<form onSubmit={handleAuth}><input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email address" autoComplete="email"/><input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" autoComplete={authMode === "login" ? "current-password" : "new-password"}/>{authMode === "register" && <input type="password" value={authConfirm} onChange={e => setAuthConfirm(e.target.value)} placeholder="Confirm password" autoComplete="new-password"/>}{authError && <p className="form-error">{authError}</p>}<button className="primary-btn full" disabled={authLoading}>{authLoading ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}</button></form><p className="login-switch">{authMode === "login" ? "New to Glassmart?" : "Already have an account?"} <button type="button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}> {authMode === "login" ? "Create account" : "Sign in"}</button></p><p className="login-note">Your account is securely managed through Glassmart authentication.</p></div></main>}
    {page === "account" && <main className="page-container"><div className="account-panel"><p className="eyebrow">ACCOUNT</p><h1>{user ? String(user.user_metadata?.name || user.email || "Account") : "Account"}</h1><button className="primary-btn" onClick={logout}>Log out</button></div></main>}
    {userRole === "admin" && page.startsWith("admin") && <AdminDashboard navigate={navigate} onLogout={logout} />}
    {toast && <div className="toast">{toast}</div>}
  </div>;
}

export default App;
