from pathlib import Path

root = Path(__file__).resolve().parents[1]
app_path = root / "src" / "App.tsx"
admin_path = root / "src" / "AdminDashboard.tsx"

app = app_path.read_text(encoding="utf-8")

# The services-page generator must never touch the navigation ternary. Rebuild
# the whole header block from stable markers after all other generators run.
header_start = app.find('  const Header = () => null;')
product_card_start = app.find('  const ProductCard =', header_start)
if header_start == -1 or product_card_start == -1:
    raise SystemExit("Could not locate App header markers")

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

# Replace only the actual rendered services page branch.
services_start = app.find('    {page === "services" &&')
contact_start = app.find('    {page === "contact" &&', services_start)
if services_start == -1 or contact_start == -1:
    raise SystemExit("Could not locate services/contact page markers")

services = '''    {page === "services" && <main className="services-quote-page">
      <div className="services-quote-intro">
        <p className="services-quote-eyebrow">OUR SERVICES</p>
        <h1>Need a Custom Solution?</h1>
        <p>Tell us what you need and our team will get back to you.</p>
      </div>
      <div className="services-quote-card">
        <div className="services-quote-copy">
          <p className="services-quote-eyebrow">GET IN TOUCH</p>
          <h2>Request a Quote</h2>
          <p>Whether you're working on a home, restaurant, office or commercial project, tell us about your requirements.</p>
        </div>
        <form className="services-quote-form" onSubmit={async (e) => {
          e.preventDefault();
          if (!enquiry.name || !enquiry.phone || !enquiry.email || !enquiry.service || !enquiry.requirements) {
            setEnquiryMessage("Please fill in all fields.");
            return;
          }
          setEnquiryLoading(true);
          setEnquiryMessage("");
          const { error } = await supabase.from("enquiries").insert({ name: enquiry.name, phone: enquiry.phone, email: enquiry.email, service: enquiry.service, requirements: enquiry.requirements });
          if (error) setEnquiryMessage(error.message);
          else {
            setEnquiryMessage("Enquiry submitted successfully. Our team will get back to you.");
            notify("Enquiry submitted successfully");
            setEnquiry({ name: "", phone: "", email: "", service: "", requirements: "" });
          }
          setEnquiryLoading(false);
        }}>
          <label>Name<input value={enquiry.name} onChange={e => setEnquiry(v => ({ ...v, name: e.target.value }))} placeholder="Your name" /></label>
          <label>Phone<input value={enquiry.phone} onChange={e => setEnquiry(v => ({ ...v, phone: e.target.value }))} placeholder="Phone number" /></label>
          <label>Email<input type="email" value={enquiry.email} onChange={e => setEnquiry(v => ({ ...v, email: e.target.value }))} placeholder="Email address" /></label>
          <label>Service required<select value={enquiry.service} onChange={e => setEnquiry(v => ({ ...v, service: e.target.value }))}><option value="">Select a service</option>{SERVICES.map(service => <option key={service} value={service}>{service}</option>)}</select></label>
          <label className="services-quote-requirements">Requirements<textarea value={enquiry.requirements} onChange={e => setEnquiry(v => ({ ...v, requirements: e.target.value }))} placeholder="Tell us what you need" /></label>
          <div className="services-quote-submit"><button className="primary-btn" type="submit" disabled={enquiryLoading}>{enquiryLoading ? "Submitting..." : "Submit Enquiry"}</button></div>
          {enquiryMessage && <div className={enquiryMessage.toLowerCase().includes("success") ? "form-success services-quote-message" : "form-error services-quote-message"}>{enquiryMessage}</div>}
        </form>
      </div>
    </main>}
'''
app = app[:services_start] + services + app[contact_start:]
app_path.write_text(app, encoding="utf-8")

admin = admin_path.read_text(encoding="utf-8")
# The generated product image modal had a missing ')' after its .map().
old = 'onChange={e => setHardwareForm(f => ({ ...f, [key]: e.target.value }))}/></label>}<label>Product image'
new = 'onChange={e => setHardwareForm(f => ({ ...f, [key]: e.target.value }))}/></label>)}<label>Product image'
if old in admin:
    admin = admin.replace(old, new, 1)
else:
    # Also handle the same corruption if whitespace/newline formatting changed.
    marker = 'onChange={e => setHardwareForm(f => ({ ...f, [key]: e.target.value }))}/></label>}'
    if marker in admin:
        admin = admin.replace(marker, marker[:-1] + ')', 1)
admin_path.write_text(admin, encoding="utf-8")

print("Generated App.tsx and AdminDashboard.tsx syntax repaired")
