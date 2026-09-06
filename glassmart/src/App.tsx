import { FormEvent, useEffect, useMemo, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient";
import glassProduct from "./assets/glass-product.jpg";
import { HARDWARE_MRP, hardwareGroups, getBrandCards, HwBrandCard } from "./hardwareData";
import "./App.css";

type Page = "home" | "products" | "product" | "services" | "contact" | "hardware" | "login" | "account" | "cart" | "checkout" | "confirmation" | "orders" | "admin" | "admin-products" | "admin-orders" | "admin-enquiries" | "admin-hardware" | "search";
type Product = { id: number; name: string; description: string; price?: number; offer_price?: number; mrp?: number; stock: number; category: string; image?: string; image_url?: string; created_at?: string };
type CartItem = { id: string; name: string; description?: string; price: number; quantity: number; image?: string; category?: string; kind: "product" | "hardware"; options?: Record<string, string> };
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
  const [accountType, setAccountType] = useState<"customer" | "carpenter">("customer");
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

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const navigate = (next: Page) => { setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const goHardwareHome = () => { setHwGroupId(null); setHwCategoryId(null); setHwBrandIndex(null); navigate("hardware"); };

  const loadProducts = async () => {
    setProductsLoading(true); setProductsError("");
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) { setProducts([fallbackProduct]); setProductsError("Products database is unavailable. Showing the editable starter product."); }
    else setProducts(data?.length ? data : [fallbackProduct]);
    setProductsLoading(false);
  };

  const loadProfile = async (currentUser: User | null) => {
    if (!currentUser) { setUserRole(""); return; }
    const { data } = await supabase.from("profiles").select("role").eq("id", currentUser.id).maybeSingle();
    setUserRole(data?.role || "");
  };

  useEffect(() => {
    loadProducts();
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
    setCart(current => { const key = `${p.id}:${JSON.stringify(options || {})}`; const existing = current.find(i => i.id === key); return existing ? current.map(i => i.id === key ? { ...i, quantity: Math.min(i.quantity + 1, p.stock) } : i) : [...current, { id: key, name: p.name, description: p.description, price, quantity: 1, image: p.image_url || p.image, category: p.category, kind: "product", options }]; });
    notify(`${p.name} added to cart`);
  };
  const addHardwareToCart = (brand: HwBrandCard, groupName: string, categoryName: string) => {
    const options = { Size: brand.sizes?.join(", ") || "Standard", Material: brand.materials?.join(", ") || "Standard", Finish: brand.finishes?.join(", ") || "Standard" };
    const key = `hardware:${groupName}:${categoryName}:${brand.brand}`;
    setCart(current => {
      const existing = current.find(i => i.id === key);
      return existing ? current.map(i => i.id === key ? { ...i, quantity: i.quantity + 1 } : i) : [...current, { id: key, name: brand.brand, description: `${categoryName} · ${groupName}`, price: HARDWARE_MRP, quantity: 1, image: brand.image, category: categoryName, kind: "hardware", options }];
    });
    notify(`${brand.brand} added to cart`);
  };
  const updateQty = (id: string, delta: number) => setCart(c => c.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  const removeItem = (id: string) => { setCart(c => c.filter(i => i.id !== id)); notify("Item removed from cart"); };
  const clearCart = () => { setCart([]); notify("Cart cleared"); };

  const runSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    setSearchQuery(query);
    navigate("search");
  };
  const searchHardware = useMemo(() => {
    const q = searchQuery.trim().toLowerCase(); if (!q) return [] as { group: string; category: string; brand: HwBrandCard }[];
    const out: { group: string; category: string; brand: HwBrandCard }[] = [];
    hardwareGroups.forEach(g => g.categories.forEach(c => getBrandCards(c).forEach(b => { if ([g.name, c.name, b.brand, ...(b.sizes || []), ...(b.materials || []), ...(b.finishes || [])].some(v => v.toLowerCase().includes(q))) out.push({ group: g.name, category: c.name, brand: b }); })));
    return out;
  }, [searchQuery]);

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
        const { error: profileError } = await supabase.from("profiles").upsert({ id: data.user.id, email: authEmail, role: accountType, points: 0 });
        if (profileError) setAuthError(`Account created, but profile setup needs attention: ${profileError.message}`);
        else { notify("Account created. Check your email if verification is enabled."); setAuthMode("login"); setAuthPassword(""); setAuthConfirm(""); }
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

  const hwGroup = hardwareGroups.find(g => g.id === hwGroupId) || null;
  const hwCategory = hwGroup?.categories.find(c => c.id === hwCategoryId) || null;
  const hwBrands = hwCategory ? getBrandCards(hwCategory) : [];
  const hwBrand = hwBrandIndex === null ? null : hwBrands[hwBrandIndex] || null;

  const Header = () => <>
    <header className="navbar">
      <button className="logo" onClick={() => navigate(userRole === "admin" ? "admin" : "home")}><span>GLASS</span>MART<small>Premium Glass Solutions</small></button>
      {userRole !== "admin" && <button className="delivery-location" onClick={() => setShowLocation(true)}><span>📍</span><span><small>Deliver to</small><strong>{selectedLocation}</strong></span></button>}
      {userRole !== "admin" && <div className="search-container"><select className="search-category" value={searchCategory} onChange={e => setSearchCategory(e.target.value)}><option>All</option><option>Glass</option><option>Hardware</option></select><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); runSearch(); } }} placeholder="Search Glassmart..." className="search-input"/><button className="search-button" type="button" onClick={runSearch}>⌕</button></div>}
      <div className="nav-right"><button className="language-btn">🇮🇳 EN</button><button className="account-btn" onClick={() => user ? navigate("account") : navigate("login")}><small>Hello</small><strong>{user ? "Account & Lists" : "Login"}</strong></button><button className="orders-btn" onClick={() => { if (!user) navigate("login"); else { loadOrders(); navigate("orders"); } }}><small>Returns</small><strong>& Orders</strong></button>{userRole !== "admin" && <button className="cart-btn" onClick={() => navigate("cart")}><span>🛒</span><strong>Cart</strong>{cartCount > 0 && <b className="cart-count">{cartCount}</b>}</button>}</div>
    </header>
    {userRole !== "admin" && <nav className="main-nav"><button className="nav-category" onClick={() => setShowCategories(v => !v)}>☰ <span>All Categories</span></button><div className="nav-menu"><button className={`nav-button ${page === "home" ? "active" : ""}`} onClick={() => navigate("home")}>Home</button><button className={`nav-button ${page === "products" || page === "product" ? "active" : ""}`} onClick={() => { setCategoryFilter("All"); setSearchQuery(""); navigate("products"); }}>Products</button><button className={`nav-button ${page === "services" ? "active" : ""}`} onClick={() => navigate("services")}>Services</button><button className={`nav-button ${page === "hardware" ? "active" : ""}`} onClick={goHardwareHome}>Hardware Fittings</button><button className={`nav-button ${page === "contact" ? "active" : ""}`} onClick={() => navigate("contact")}>Contact</button></div></nav>}
    {showCategories && <div className="category-menu"><button onClick={() => { setCategoryFilter("All"); setShowCategories(false); navigate("products"); }}>All Glass Products</button>{PRODUCT_CATEGORIES.map(c => <button key={c} onClick={() => { setCategoryFilter(c); setSearchQuery(""); setShowCategories(false); navigate("products"); }}>{c}</button>)}<button onClick={() => { setShowCategories(false); goHardwareHome(); }}>Hardware Fittings</button><button onClick={() => { setShowCategories(false); navigate("services"); }}>Services</button></div>}
  </>;

  const ProductCard = ({ p }: { p: Product }) => <article className="product-card"><button className="product-image" onClick={() => { setSelectedProduct(p); navigate("product"); }}>{p.image_url || p.image ? <img src={p.image_url || p.image} alt={p.name} onError={e => { e.currentTarget.style.display = "none"; }} /> : <span>GLASSMART</span>}</button><div className="product-info"><p className="product-category">{p.category || "Glass"}</p><h3>{p.name}</h3><p className="product-description">{p.description || "Premium quality glass product."}</p><div className="product-pricing">{p.offer_price !== undefined ? <><strong>{money(p.offer_price)}</strong>{p.mrp ? <del>{money(p.mrp)}</del> : null}</> : p.price !== undefined ? <strong>{money(p.price)}</strong> : <span>Request quote</span>}</div><p className={p.stock > 0 ? "product-stock" : "product-stock out"}>{p.stock > 0 ? `${p.stock} available` : "Out of stock"}</p><div className="card-actions"><button className="secondary-btn" onClick={() => { setSelectedProduct(p); navigate("product"); }}>View Details</button><button className="primary-btn" disabled={p.stock <= 0} onClick={() => addToCart(p)}>{p.stock > 0 ? "Add to Cart" : "Out of Stock"}</button></div></div></article>;

  return <div className="app"><Header />
    {showLocation && <div className="modal-backdrop" onClick={() => setShowLocation(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowLocation(false)}>×</button><p className="eyebrow">DELIVERY LOCATION</p><h2>Where should we deliver?</h2><input value={locationText} onChange={e => setLocationText(e.target.value)} placeholder="City / location"/><input value={locationPin} onChange={e => setLocationPin(e.target.value)} placeholder="PIN / postal code"/><div className="modal-actions"><button className="secondary-btn" onClick={useBrowserLocation}>Use my location</button><button className="primary-btn" onClick={() => selectLocation(locationText ? `${locationText}${locationPin ? `, ${locationPin}` : ""}` : locationPin)}>Save location</button></div></div></div>}

    {page === "home" && <main><section className="hero"><div className="hero-content"><p className="eyebrow">PREMIUM GLASS SOLUTIONS</p><h1>Glass that makes<br/><span>spaces beautiful.</span></h1><p className="hero-text">Discover premium decorative glass for homes, restaurants, offices and commercial spaces.</p><div className="hero-buttons"><button className="primary-btn" onClick={() => navigate("products")}>Explore Products →</button><button className="secondary-btn" onClick={() => navigate("services")}>Request a Quote</button></div></div><div className="hero-visual"><div className="glass-card"><img src={glassProduct} alt="Premium decorative glass"/><div className="glass-overlay"><p>PREMIUM</p><h3>DECORATIVE<br/>GLASS</h3></div></div></div></section><section className="section"><div className="section-heading"><p className="eyebrow">EXPLORE</p><h2>Our Glass Collection</h2><p>Quality glass solutions for every space.</p></div><div className="category-grid">{PRODUCT_CATEGORIES.map((c, i) => <button className="category-card" key={c} onClick={() => { setCategoryFilter(c); setSearchQuery(""); navigate("products"); }}><div className="category-icon">{["◈", "▥", "◇", "▦"][i]}</div><h3>{c}</h3><p>{["Elegant designs for interiors.", "Modern solutions for offices.", "Premium glass for unique spaces.", "Made according to your needs."][i]}</p><span>Browse →</span></button>)}</div></section><section className="section featured"><div className="section-heading"><p className="eyebrow">FEATURED</p><h2>Popular Product</h2></div><div className="featured-product"><div className="product-image large"><img src={fallbackProduct.image} alt="Premium etched glass"/></div><div className="product-info"><p className="product-category">{fallbackProduct.category}</p><h2>{fallbackProduct.name}</h2><p>{fallbackProduct.description}</p><div className="price"><strong>{money(fallbackProduct.price || 0)}</strong><del>{money(fallbackProduct.mrp || 0)}</del></div><button className="primary-btn" onClick={() => addToCart(fallbackProduct)}>Add to Cart</button></div></div></section><section className="about"><div><p className="eyebrow">ABOUT GLASSMART</p><h2>Designed for modern spaces.</h2></div><p>Glassmart provides quality glass products and solutions for residential, commercial and hospitality projects. From decorative glass to custom installations, we help transform ordinary spaces into something special.</p></section></main>}

    {page === "products" && <main className="page-container"><div className="page-title"><p className="eyebrow">GLASSMART PRODUCTS</p><h1>Our Products</h1><p>Browse our collection and add products to your cart.</p></div><div className="toolbar"><select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option>All</option>{PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>{productsError && <span className="notice">{productsError}</span>}</div>{productsLoading ? <div className="loading">Loading products…</div> : filteredProducts.length ? <div className="products-grid">{filteredProducts.map(p => <ProductCard key={p.id} p={p}/>)}</div> : <div className="empty-state"><div>⌕</div><h2>No products found.</h2><p>Try another category or search term.</p><button className="primary-btn" onClick={() => { setCategoryFilter("All"); setSearchQuery(""); }}>Clear filters</button></div>}</main>}

    {page === "product" && selectedProduct && <main className="page-container"><button className="back-link" onClick={() => navigate("products")}>← Back to Products</button><div className="product-detail"><div className="detail-image">{selectedProduct.image_url || selectedProduct.image ? <img src={selectedProduct.image_url || selectedProduct.image} alt={selectedProduct.name}/> : <span>GLASSMART</span>}</div><div className="detail-info"><p className="product-category">{selectedProduct.category}</p><h1>{selectedProduct.name}</h1><p>{selectedProduct.description}</p><div className="price-row">{selectedProduct.offer_price !== undefined ? <><strong>{money(selectedProduct.offer_price)}</strong>{selectedProduct.mrp ? <del>{money(selectedProduct.mrp)}</del> : null}</> : <strong>{selectedProduct.price ? money(selectedProduct.price) : "Request a quote"}</strong>}</div><p className="product-stock">{selectedProduct.stock > 0 ? `${selectedProduct.stock} available` : "Out of stock"}</p>{selectedProduct.stock > 0 && <button className="primary-btn" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>}<button className="secondary-btn" onClick={() => navigate("services")}>Need a custom option? Request a quote</button></div></div><section className="section"><h2>Related products</h2><div className="products-grid">{products.filter(p => p.id !== selectedProduct.id && p.category === selectedProduct.category).slice(0, 4).map(p => <ProductCard key={p.id} p={p}/>)}</div></section></main>}

    {page === "search" && <main className="page-container"><div className="page-title"><p className="eyebrow">SEARCH</p><h1>Results for “{searchQuery}”</h1></div>{filteredProducts.length ? <><h2>Glass products</h2><div className="products-grid">{filteredProducts.map(p => <ProductCard key={p.id} p={p}/>)}</div></> : <div className="empty-state"><div>⌕</div><h2>No glass products found.</h2></div>}{searchHardware.length > 0 && <section className="section search-hardware"><h2>Hardware matches</h2><div className="hw-grid">{searchHardware.map((r, i) => <button className="hw-card" key={`${r.brand.brand}-${i}`} onClick={() => { const g = hardwareGroups.find(x => x.name === r.group); const c = g?.categories.find(x => x.name === r.category); setHwGroupId(g?.id || null); setHwCategoryId(c?.id || null); setHwBrandIndex(c ? getBrandCards(c).findIndex(b => b.brand === r.brand.brand && b.image === r.brand.image) : null); navigate("hardware"); }}><span className="hw-card-name">{r.brand.brand}</span><span className="hw-card-meta">{r.group} / {r.category}</span><span className="hw-card-arrow">→</span></button>)}</div></section>}</main>}

    {page === "hardware" && <main className="page-container hw-page"><div className="hw-heading"><p className="hw-eyebrow">HARDWARE FITTINGS CATALOGUE</p><h1>Hardware fittings catalog</h1><p className="hw-count">12 categories · 5 groups</p></div>{!hwGroup && <div className="hw-grid hw-grid-groups">{hardwareGroups.map(g => <button className="hw-card hw-group-card" key={g.id} onClick={() => { setHwGroupId(g.id); setHwCategoryId(null); setHwBrandIndex(null); }}><span className="hw-card-name">{g.name}</span><span className="hw-card-meta">{g.categories.length} {g.categories.length === 1 ? "category" : "categories"}</span><span className="hw-card-arrow">→</span></button>)}</div>}{hwGroup && !hwCategory && <div className="hw-level"><button className="hw-back-btn" onClick={() => setHwGroupId(null)}>← Back</button><div className="hw-crumb">{hwGroup.name}</div><div className="hw-grid">{hwGroup.categories.map(c => <button className="hw-card" key={c.id} onClick={() => setHwCategoryId(c.id)}><span className="hw-card-name">{c.name}</span><span className="hw-card-arrow">→</span></button>)}</div></div>}{hwGroup && hwCategory && !hwBrand && <div className="hw-level"><button className="hw-back-btn" onClick={() => setHwCategoryId(null)}>← Back</button><div className="hw-crumb">{hwGroup.name} <span>/</span> {hwCategory.name}</div><div className="hw-grid">{hwBrands.map((b, i) => <button className="hw-card hw-brand-card" key={`${b.brand}-${i}`} onClick={() => setHwBrandIndex(i)}>{b.image ? <img className="hw-card-image" src={b.image} alt="" onError={e => { e.currentTarget.style.display = "none"; }}/> : null}<span className="hw-card-name">{b.brand}</span><span className="hw-card-arrow">→</span></button>)}</div></div>}{hwGroup && hwCategory && hwBrand && <div className="hw-level"><button className="hw-back-btn" onClick={() => setHwBrandIndex(null)}>← Back</button><div className="hw-crumb">{hwGroup.name} <span>/</span> {hwCategory.name} <span>/</span> {hwBrand.brand}</div><div className="hw-detail-card">{hwBrand.image ? <div className="hw-detail-image"><img src={hwBrand.image} alt={hwBrand.brand} onError={e => { e.currentTarget.style.display = "none"; }}/></div> : null}<div><h2>{hwBrand.brand}</h2>{hwBrand.sizes?.length ? <div className="hw-detail-section"><p className="hw-detail-label">Available sizes</p><div className="hw-chips">{hwBrand.sizes.map(s => <span className="hw-chip hw-chip-size" key={s}>{s}</span>)}</div></div> : null}{hwBrand.materials?.length ? <div className="hw-detail-section"><p className="hw-detail-label">Material type</p><div className="hw-chips">{hwBrand.materials.map(s => <span className="hw-chip hw-chip-material" key={s}>{s}</span>)}</div></div> : null}{hwBrand.finishes?.length ? <div className="hw-detail-section"><p className="hw-detail-label">Finish</p><div className="hw-chips">{hwBrand.finishes.map(s => <span className="hw-chip hw-chip-finish" key={s}>{s}</span>)}</div></div> : null}<div className="hw-price"><strong>MRP {money(HARDWARE_MRP)}</strong></div><button className="primary-btn" onClick={() => addHardwareToCart(hwBrand, hwGroup.name, hwCategory.name)}>Add to Cart</button></div></div></div>}</main>}

    {page === "cart" && <main className="page-container"><div className="page-title"><p className="eyebrow">YOUR SHOPPING CART</p><h1>Cart</h1></div>{!cart.length ? <div className="empty-state"><div>🛒</div><h2>Your cart is empty</h2><p>Add a product to get started.</p><button className="primary-btn" onClick={() => navigate("products")}>Browse Products</button></div> : <div className="cart-layout"><div>{cart.map(i => <div className="cart-item" key={i.id}><div className="cart-thumb">{i.image ? <img src={i.image} alt="" onError={e => { e.currentTarget.style.display = "none"; }}/> : <span>GLASS</span>}</div><div className="cart-product-info"><p className="product-category">{i.category}</p><h2>{i.name}</h2>{i.options && Object.entries(i.options).map(([k, v]) => <small key={k}>{k}: {v}</small>)}<p>{money(i.price)} each</p><div className="quantity"><button onClick={() => updateQty(i.id, -1)}>−</button><span>{i.quantity}</span><button onClick={() => updateQty(i.id, 1)}>+</button></div><button className="text-btn" onClick={() => removeItem(i.id)}>Remove</button></div><strong>{money(i.price * i.quantity)}</strong></div>)}</div><aside className="summary"><h2>Order Summary</h2><div className="summary-row"><span>Subtotal</span><span>{money(cartTotal)}</span></div><div className="summary-row"><span>Delivery</span><span>Calculated at order processing</span></div><hr/><div className="summary-total"><span>Total</span><strong>{money(cartTotal)}</strong></div><button className="primary-btn full" onClick={() => user ? navigate("checkout") : navigate("login")}>Proceed to Checkout →</button><button className="secondary-btn full" onClick={clearCart}>Clear Cart</button></aside></div>}</main>}

    {page === "checkout" && <main className="page-container"><div className="page-title"><p className="eyebrow">CHECKOUT</p><h1>Complete Your Order</h1></div>{!cart.length ? <div className="empty-state"><h2>Your cart is empty.</h2><button className="primary-btn" onClick={() => navigate("products")}>Browse Products</button></div> : <form className="checkout-layout" onSubmit={placeOrder}><div className="checkout-form"><h2>Customer Details</h2>{([["name","Name"],["email","Email"],["phone","Phone"],["address","Delivery Address"],["city","City"],["state","State"],["pin","PIN code"]] as [keyof typeof checkout,string][]).map(([key,label]) => key === "address" ? <label key={key}>{label}<textarea required value={checkout[key]} onChange={e => setCheckout(c => ({ ...c, [key]: e.target.value }))}/></label> : <label key={key}>{label}<input required type={key === "email" ? "email" : key === "phone" || key === "pin" ? "tel" : "text"} value={checkout[key]} onChange={e => setCheckout(c => ({ ...c, [key]: e.target.value }))}/></label>)}<h2>Payment</h2><div className="payment-option"><strong>Cash on Delivery / Request Order</strong><p>No fake payment is performed. A real gateway can be connected later.</p></div>{checkoutError && <p className="form-error">{checkoutError}</p>}<button className="primary-btn full" disabled={placingOrder}>{placingOrder ? "Placing order…" : `Place Order — ${money(cartTotal)}`}</button></div><aside className="summary"><h2>Your Order</h2>{cart.map(i => <div className="summary-row" key={i.id}><span>{i.name} × {i.quantity}</span><span>{money(i.price * i.quantity)}</span></div>)}<hr/><div className="summary-total"><span>Total</span><strong>{money(cartTotal)}</strong></div></aside></form>}</main>}

    {page === "confirmation" && <main className="page-container"><div className="success"><div className="success-icon">✓</div><p className="eyebrow">ORDER PLACED</p><h1>Thank you for your order!</h1><p>Your order <strong>#{lastOrder?.id || ""}</strong> has been received.</p>{lastOrder && <div className="order-box"><div><span>Status</span><strong>{lastOrder.status}</strong></div><div><span>Total</span><strong>{money(lastOrder.total)}</strong></div><div><span>Delivery</span><strong>{lastOrder.city}, {lastOrder.pin}</strong></div></div>}<button className="primary-btn" onClick={() => { loadOrders(); navigate("orders"); }}>View Orders</button><button className="secondary-btn" onClick={() => navigate("home")}>Back to Home</button></div></main>}

    {page === "orders" && <main className="page-container"><div className="page-title"><p className="eyebrow">YOUR ACCOUNT</p><h1>Returns & Orders</h1></div>{ordersLoading ? <div className="loading">Loading orders…</div> : orders.length ? <div className="orders-list">{orders.map(o => <article className="order-card" key={o.id}><div><strong>#{o.id}</strong><span>{new Date(o.created_at).toLocaleDateString()}</span></div><p>{o.items.map(i => `${i.name} × ${i.quantity}`).join(", ")}</p><div><span>{money(o.total)}</span><b>{o.status}</b></div></article>)}</div> : <div className="empty-state"><h2>No orders yet.</h2><p>Your placed orders will appear here.</p><button className="primary-btn" onClick={() => navigate("products")}>Start Shopping</button></div>}</main>}

    {page === "services" && <main className="page-container"><div className="services-intro"><p className="eyebrow">OUR SERVICES</p><h1>Need a Custom Solution?</h1><p>Tell us what you need and our team will get back to you.</p></div><section className="service-layout"><div className="service-info"><p className="eyebrow">GET IN TOUCH</p><h2>Request a Quote</h2><p>Whether you're working on a home, restaurant, office or commercial project, tell us about your requirements.</p></div><form className="checkout-form" onSubmit={submitEnquiry}><label>Name<input required value={enquiry.name} onChange={e => setEnquiry(x => ({ ...x, name: e.target.value }))}/></label><label>Phone<input required value={enquiry.phone} onChange={e => setEnquiry(x => ({ ...x, phone: e.target.value }))}/></label><label>Email<input required type="email" value={enquiry.email} onChange={e => setEnquiry(x => ({ ...x, email: e.target.value }))}/></label><label>Service required<select required value={enquiry.service} onChange={e => setEnquiry(x => ({ ...x, service: e.target.value }))}><option value="">Select a service</option>{SERVICES.map(s => <option key={s}>{s}</option>)}</select></label><label>Requirements<textarea required value={enquiry.requirements} onChange={e => setEnquiry(x => ({ ...x, requirements: e.target.value }))}/></label>{enquiryMessage && <p className={enquiryMessage.startsWith("Enquiry") ? "form-success" : "form-error"}>{enquiryMessage}</p>}<button className="primary-btn full" disabled={enquiryLoading}>{enquiryLoading ? "Submitting…" : "Submit Enquiry"}</button></form></section></main>}

    {page === "contact" && <main className="page-container"><div className="page-title"><p className="eyebrow">GET IN TOUCH</p><h1>Contact Glassmart</h1><p>Use the contact details already configured for your business, or replace the marked placeholders before launch.</p></div><div className="contact-grid"><a className="contact-card" href="tel:+91"><span>📞</span><h3>Call Us</h3><p>+91 XXXXX XXXXX</p></a><a className="contact-card" href="mailto:info@glassmart.com"><span>✉️</span><h3>Email</h3><p>info@glassmart.com</p></a><div className="contact-card"><span>📍</span><h3>Visit Us</h3><p>Glassmart Showroom</p></div></div><div className="contact-note"><strong>Business details placeholder</strong><p>No verified phone, address or business hours were present in the existing project, so they have not been invented.</p></div></main>}

    {page === "login" && <main className="page-container login-page"><form className="login-box" onSubmit={handleAuth}><p className="eyebrow">GLASSMART ACCOUNT</p><h1>{authMode === "login" ? "Welcome back" : "Create account"}</h1>{authMode === "register" && <><input required placeholder="Full name" value={authName} onChange={e => setAuthName(e.target.value)}/><input required placeholder="Phone" value={authPhone} onChange={e => setAuthPhone(e.target.value)}/><div className="account-type-grid"><button type="button" className={`account-type ${accountType === "customer" ? "active" : ""}`} onClick={() => setAccountType("customer")}>Customer</button><button type="button" className={`account-type ${accountType === "carpenter" ? "active" : ""}`} onClick={() => setAccountType("carpenter")}>Carpenter</button></div></>}<input required type="email" placeholder="Email address" value={authEmail} onChange={e => setAuthEmail(e.target.value)}/><input required type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)}/>{authMode === "register" && <input required type="password" placeholder="Confirm password" value={authConfirm} onChange={e => setAuthConfirm(e.target.value)}/>} {authError && <p className="form-error">{authError}</p>}<button className="primary-btn full" disabled={authLoading}>{authLoading ? "Please wait…" : authMode === "login" ? "Login" : "Create Account"}</button><p className="login-switch">{authMode === "login" ? "Don't have an account?" : "Already have an account?"} <button type="button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>{authMode === "login" ? "Register" : "Login"}</button></p><p className="login-note">Admin access is not available through public registration.</p></form></main>}

    {page === "account" && <main className="page-container"><div className="account-panel"><p className="eyebrow">MY ACCOUNT</p><h1>{user?.user_metadata?.name || "Glassmart User"}</h1><div className="account-details"><div><span>Email</span><strong>{user?.email}</strong></div><div><span>Phone</span><strong>{user?.user_metadata?.phone || "Not set"}</strong></div><div><span>Account type</span><strong>{userRole || user?.user_metadata?.account_type || "Customer"}</strong></div><div><span>Delivery location</span><strong>{selectedLocation}</strong></div></div><div className="hero-buttons"><button className="primary-btn" onClick={() => { loadOrders(); navigate("orders"); }}>View Orders</button><button className="secondary-btn" onClick={logout}>Logout</button></div></div></main>}

    {page === "admin" && userRole === "admin" && <main className="page-container"><div className="admin-dashboard"><p className="eyebrow">GLASSMART ADMIN</p><h1>Admin Dashboard</h1><p>Manage the store without exposing admin registration publicly.</p><div className="admin-grid"><button className="admin-card" onClick={() => { setAdminProducts(products); navigate("admin-products"); }}><h2>Products</h2><p>Manage products, prices, stock and image paths.</p></button><button className="admin-card" onClick={() => navigate("admin-orders")}><h2>Orders</h2><p>Review customer orders and statuses.</p></button><button className="admin-card" onClick={() => navigate("admin-enquiries")}><h2>Quotations</h2><p>View service enquiries.</p></button><button className="admin-card" onClick={() => navigate("admin-hardware")}><h2>Hardware</h2><p>Open the hierarchical hardware catalogue and photo paths.</p></button></div></div></main>}

    {page === "admin-products" && userRole === "admin" && <main className="page-container"><div className="admin-page-header"><div><p className="eyebrow">GLASSMART ADMIN</p><h1>Products</h1></div><button className="primary-btn" onClick={() => { setEditingProduct(null); setAdminProduct({ name: "", description: "", mrp: "", offer_price: "", stock: "", category: "", image_url: "" }); setShowProductForm(true); }}>+ Add Product</button></div>{showProductForm && <form className="admin-form" onSubmit={saveAdminProduct}><h2>{editingProduct ? "Edit Product" : "Add Product"}</h2><input required placeholder="Product name" value={adminProduct.name} onChange={e => setAdminProduct({ ...adminProduct, name: e.target.value })}/><textarea placeholder="Description" value={adminProduct.description} onChange={e => setAdminProduct({ ...adminProduct, description: e.target.value })}/><input required type="number" placeholder="MRP" value={adminProduct.mrp} onChange={e => setAdminProduct({ ...adminProduct, mrp: e.target.value })}/><input required type="number" placeholder="Offer price" value={adminProduct.offer_price} onChange={e => setAdminProduct({ ...adminProduct, offer_price: e.target.value })}/><input type="number" placeholder="Stock" value={adminProduct.stock} onChange={e => setAdminProduct({ ...adminProduct, stock: e.target.value })}/><input required placeholder="Category" value={adminProduct.category} onChange={e => setAdminProduct({ ...adminProduct, category: e.target.value })}/><input placeholder="Image path e.g. /images/products/product-001.jpg" value={adminProduct.image_url} onChange={e => setAdminProduct({ ...adminProduct, image_url: e.target.value })}/>{adminMessage && <p className="notice">{adminMessage}</p>}<div className="modal-actions"><button className="primary-btn">Save Product</button><button type="button" className="secondary-btn" onClick={() => setShowProductForm(false)}>Cancel</button></div></form>}<div className="admin-table"><div className="admin-row admin-heading"><span>Product</span><span>Offer</span><span>Stock</span><span>Actions</span></div>{(adminProducts.length ? adminProducts : products).map(p => <div className="admin-row" key={p.id}><span>{p.name}</span><span>{money(Number(p.offer_price ?? p.price ?? 0))}</span><span>{p.stock}</span><span><button onClick={() => openEdit(p)}>Edit</button><button onClick={() => deleteAdminProduct(p)}>Delete</button></span></div>)}</div><button className="back-link" onClick={() => navigate("admin")}>← Back to Dashboard</button></main>}

    {page === "admin-orders" && userRole === "admin" && <AdminOrders />}
    {page === "admin-enquiries" && userRole === "admin" && <AdminEnquiries />}
    {page === "admin-hardware" && userRole === "admin" && <main className="page-container"><div className="page-title"><p className="eyebrow">GLASSMART ADMIN</p><h1>Hardware catalogue</h1><p>Hardware remains hierarchical; use the customer catalogue to inspect groups, categories and brand details.</p></div><button className="primary-btn" onClick={goHardwareHome}>Open Hardware Catalogue</button><button className="back-link" onClick={() => navigate("admin")}>← Back to Dashboard</button></main>}

    {userRole === "admin" && page !== "admin" && page !== "admin-products" && page !== "admin-orders" && page !== "admin-enquiries" && page !== "admin-hardware" && <main className="page-container empty-state"><h2>Admin access</h2><p>This account has admin privileges.</p><button className="primary-btn" onClick={() => navigate("admin")}>Open Dashboard</button></main>}

    <footer><div className="footer-logo"><span>GLASS</span>MART</div><p>Premium glass solutions for modern spaces.</p><div className="footer-links"><button onClick={() => navigate("products")}>Products</button><button onClick={() => navigate("services")}>Services</button><button onClick={goHardwareHome}>Hardware</button><button onClick={() => navigate("contact")}>Contact</button></div><p className="copyright">© 2026 Glassmart. All rights reserved.</p></footer>{toast && <div className="toast">✓ {toast}</div>}</div>;

  function AdminOrders() { const [data, setData] = useState<Order[]>([]); const [loading, setLoading] = useState(true); useEffect(() => { supabase.from("orders").select("*").order("created_at", { ascending: false }).then(r => { if (r.data) setData(r.data as Order[]); setLoading(false); }); }, []); const updateStatus = async (id: string, status: string) => { const { error } = await supabase.from("orders").update({ status }).eq("id", id); if (error) notify(error.message); else setData(d => d.map(o => o.id === id ? { ...o, status } : o)); }; return <main className="page-container"><div className="page-title"><p className="eyebrow">GLASSMART ADMIN</p><h1>Orders</h1></div>{loading ? <div className="loading">Loading…</div> : data.length ? <div className="orders-list">{data.map(o => <article className="order-card" key={o.id}><div><strong>#{o.id}</strong><span>{new Date(o.created_at).toLocaleString()}</span></div><p>{o.customer_name} · {o.email} · {o.phone}</p><p>{o.items.map(i => `${i.name} × ${i.quantity}`).join(", ")}</p><div><strong>{money(o.total)}</strong><select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>{["Order placed","Confirmed","Processing","Ready for delivery","Delivered","Cancelled"].map(s => <option key={s}>{s}</option>)}</select></div></article>)}</div> : <div className="empty-state"><h2>No orders yet.</h2></div>}<button className="back-link" onClick={() => navigate("admin")}>← Back to Dashboard</button></main>; }
  function AdminEnquiries() { const [data, setData] = useState<Enquiry[]>([]); const [loading, setLoading] = useState(true); useEffect(() => { supabase.from("enquiries").select("*").order("created_at", { ascending: false }).then(r => { if (r.data) setData(r.data as Enquiry[]); setLoading(false); }); }, []); return <main className="page-container"><div className="page-title"><p className="eyebrow">GLASSMART ADMIN</p><h1>Service enquiries</h1></div>{loading ? <div className="loading">Loading…</div> : data.length ? <div className="orders-list">{data.map((x, i) => <article className="order-card" key={x.id || i}><div><strong>{x.name}</strong><span>{x.email} · {x.phone}</span></div><p><b>{x.service}</b></p><p>{x.requirements}</p></article>)}</div> : <div className="empty-state"><h2>No enquiries yet.</h2></div>}<button className="back-link" onClick={() => navigate("admin")}>← Back to Dashboard</button></main>; }
}

export default App;
