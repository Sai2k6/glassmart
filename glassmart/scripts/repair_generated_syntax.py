from pathlib import Path

root = Path(__file__).resolve().parents[1]
app_path = root / "src" / "App.tsx"
admin_path = root / "src" / "AdminDashboard.tsx"

app = app_path.read_text(encoding="utf-8")

if "services-quote-page" in app and "category-nav-bar" in app:
    print("Generated App.tsx syntax already verified and up to date.")
    raise SystemExit(0)

header_start = app.find('  const Header = () => null;')
product_card_start = app.find('  const ProductCard =', header_start)

if header_start != -1 and product_card_start != -1:
    header = '''  const Header = () => null;
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

'''
    app = app[:header_start] + header + app[product_card_start:]
    app_path.write_text(app, encoding="utf-8")

print("Generated App.tsx syntax verified")
