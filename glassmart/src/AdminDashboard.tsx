import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";

type AdminDashboardProps = { navigate: (page: any) => void; onLogout: () => void };
type Row = Record<string, any>;

const money = (n: any) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const date = (v: any) => v ? new Date(v).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const enquiryStatuses = ["new", "contacted", "quoted", "in_progress", "resolved", "closed"];
const quoteStatuses = ["draft", "sent", "accepted", "rejected", "expired"];
const roles = ["customer", "carpenter", "interior", "engineer", "architect", "admin"];

export default function AdminDashboard({ navigate, onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState("overview");
  const [orders, setOrders] = useState<Row[]>([]);
  const [enquiries, setEnquiries] = useState<Row[]>([]);
  const [quotations, setQuotations] = useState<Row[]>([]);
  const [products, setProducts] = useState<Row[]>([]);
  const [hardwareProducts, setHardwareProducts] = useState<Row[]>([]);
  const [hardwareVariants, setHardwareVariants] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [quoteForm, setQuoteForm] = useState({ enquiry_id: "", customer_name: "", email: "", phone: "", title: "", amount: "", status: "draft", notes: "", valid_until: "" });
  const [productForm, setProductForm] = useState<Row | null>(null);
  const [hardwareForm, setHardwareForm] = useState<Row | null>(null);
  const [variantForm, setVariantForm] = useState<Row | null>(null);

  const notify = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(""), 2800); };

  const loadAll = async () => {
    setLoading(true);
    const [o, e, q, p, hp, hv, u] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
      supabase.from("quotations").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("hardware_products").select("*").order("group_name").order("category_name").order("brand"),
      supabase.from("hardware_variants").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);
    if (o.error) notify(`Orders: ${o.error.message}`); else setOrders(o.data || []);
    if (e.error) notify(`Enquiries: ${e.error.message}`); else setEnquiries(e.data || []);
    if (!q.error) setQuotations(q.data || []);
    if (p.error) notify(`Products: ${p.error.message}`); else setProducts(p.data || []);
    if (hp.error) notify(`Hardware products: ${hp.error.message}`); else setHardwareProducts(hp.data || []);
    if (hv.error) notify(`Hardware variants: ${hv.error.message}`); else setHardwareVariants(hv.data || []);
    if (u.error) notify(`Users: ${u.error.message}`); else setProfiles(u.data || []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const stats = useMemo(() => ({
    orders: orders.length,
    pendingOrders: orders.filter(o => ["pending", "confirmed", "processing"].includes(o.status)).length,
    enquiries: enquiries.filter(e => !["resolved", "closed"].includes(e.status)).length,
    users: profiles.length,
    products: products.length,
    hardware: hardwareProducts.length,
    variants: hardwareVariants.length,
    quotes: quotations.length,
  }), [orders, enquiries, profiles, products, hardwareProducts, hardwareVariants, quotations]);

  const updateRow = async (table: string, id: string, values: Row, after?: () => void) => {
    const { error } = await supabase.from(table).update(values).eq("id", id);
    if (error) return notify(error.message);
    notify("Saved successfully"); after?.(); await loadAll();
  };
  const deleteRow = async (table: string, id: string) => {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return notify(error.message);
    notify("Deleted"); await loadAll();
  };

  const saveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!productForm?.name || !productForm?.category) return notify("Product name and category are required.");
    const payload = { name: productForm.name, description: productForm.description || "", mrp: Number(productForm.mrp) || 0, offer_price: Number(productForm.offer_price) || 0, stock: Number(productForm.stock) || 0, category: productForm.category, image_url: productForm.image_url || null };
    const query = productForm.id ? supabase.from("products").update(payload).eq("id", productForm.id) : supabase.from("products").insert(payload);
    const { error } = await query;
    if (error) return notify(error.message);
    setProductForm(null); notify(productForm.id ? "Product updated" : "Product created"); await loadAll();
  };

  const saveHardwareProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!hardwareForm?.brand || !hardwareForm?.group_name || !hardwareForm?.category_name) return notify("Group, category and brand are required.");
    const payload = { group_name: hardwareForm.group_name, category_name: hardwareForm.category_name, brand: hardwareForm.brand, image_url: hardwareForm.image_url || null, mrp: 500, active: hardwareForm.active !== false };
    const query = hardwareForm.id ? supabase.from("hardware_products").update(payload).eq("id", hardwareForm.id) : supabase.from("hardware_products").insert(payload);
    const { error } = await query;
    if (error) return notify(error.message);
    setHardwareForm(null); notify(hardwareForm.id ? "Hardware product updated" : "Hardware product created"); await loadAll();
  };

  const saveVariant = async (e: FormEvent) => {
    e.preventDefault();
    if (!variantForm?.hardware_product_id) return notify("Hardware product is required.");
    const payload = { hardware_product_id: variantForm.hardware_product_id, size: variantForm.size || "Standard", material: variantForm.material || "Standard", finish: variantForm.finish || "Standard", stock: Math.max(0, Number(variantForm.stock) || 0), active: variantForm.active !== false };
    const query = variantForm.id ? supabase.from("hardware_variants").update(payload).eq("id", variantForm.id) : supabase.from("hardware_variants").insert(payload);
    const { error } = await query;
    if (error) return notify(error.message);
    setVariantForm(null); notify(variantForm.id ? "Variant updated" : "Variant created"); await loadAll();
  };

  const saveQuote = async (e: FormEvent) => {
    e.preventDefault();
    if (!quoteForm.customer_name || !quoteForm.title) return notify("Customer and quote title are required.");
    const payload = { ...quoteForm, amount: Number(quoteForm.amount) || 0, enquiry_id: quoteForm.enquiry_id || null, valid_until: quoteForm.valid_until || null };
    const { error } = await supabase.from("quotations").insert(payload);
    if (error) return notify(error.message);
    setQuoteForm({ enquiry_id: "", customer_name: "", email: "", phone: "", title: "", amount: "", status: "draft", notes: "", valid_until: "" });
    notify("Quotation created"); await loadAll();
  };

  const filtered = (rows: Row[], fields: string[]) => {
    const q = search.trim().toLowerCase(); if (!q) return rows;
    return rows.filter(row => fields.some(field => String(row[field] ?? "").toLowerCase().includes(q)));
  };

  const navItems = [
    ["overview", "Overview"], ["orders", "Orders"], ["enquiries", "Enquiries"], ["quotations", "Quotations"], ["products", "Products"], ["hardware", "Hardware"], ["users", "Users"]
  ];

  return <main className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span>GLASS</span>MART<small>Admin control centre</small></div>
      <nav>{navItems.map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setSearch(""); }}>{label}</button>)}</nav>
      <div className="admin-sidebar-bottom"><button onClick={() => loadAll()}>↻ Refresh data</button><button onClick={onLogout}>Log out</button></div>
    </aside>
    <section className="admin-content">
      <div className="admin-topbar"><div><p className="eyebrow">GLASSMART ADMIN</p><h1>{navItems.find(x => x[0] === tab)?.[1] || "Admin"}</h1></div><div className="admin-top-actions"><button className="secondary-btn" onClick={() => navigate("home")}>View website</button><button className="primary-btn" onClick={loadAll}>Refresh</button></div></div>
      {message && <div className="admin-alert">{message}</div>}
      {loading ? <div className="admin-loading">Loading your business data…</div> : <>
        {tab === "overview" && <>
          <div className="admin-stat-grid">{[["Orders", stats.orders, "admin-orders"], ["Open orders", stats.pendingOrders, "admin-orders"], ["Open enquiries", stats.enquiries, "admin-enquiries"], ["Quotations", stats.quotes, "quotations"], ["Users", stats.users, "users"], ["Products", stats.products, "products"], ["Hardware brands", stats.hardware, "hardware"], ["Hardware variants", stats.variants, "hardware"]].map(([label, value, target]) => <button key={String(label)} className="admin-stat" onClick={() => setTab(String(target))}><span>{label}</span><strong>{value}</strong></button>)}</div>
          <div className="admin-two-col"><section className="admin-panel"><div className="admin-panel-head"><h2>Recent orders</h2><button onClick={() => setTab("orders")}>View all</button></div>{orders.slice(0, 6).map(o => <div className="admin-list-row" key={o.id}><div><strong>{o.customer_name || o.email || "Customer"}</strong><small>{date(o.created_at)} · {o.id}</small></div><span>{money(o.total)}</span><select value={o.status || "pending"} onChange={e => updateRow("orders", o.id, { status: e.target.value })}>{orderStatuses.map(s => <option key={s}>{s}</option>)}</select></div>)}{!orders.length && <p className="admin-muted">No orders yet.</p>}</section><section className="admin-panel"><div className="admin-panel-head"><h2>Latest enquiries</h2><button onClick={() => setTab("enquiries")}>View all</button></div>{enquiries.slice(0, 6).map(e => <div className="admin-list-row" key={e.id}><div><strong>{e.name || "Enquiry"}</strong><small>{e.service || "General enquiry"} · {date(e.created_at)}</small></div><select value={e.status || "new"} onChange={x => updateRow("enquiries", e.id, { status: x.target.value })}>{enquiryStatuses.map(s => <option key={s}>{s}</option>)}</select></div>)}{!enquiries.length && <p className="admin-muted">No enquiries yet.</p>}</section></div>
        </>}

        {tab === "orders" && <section className="admin-panel"><div className="admin-toolbar"><input placeholder="Search orders, customer, email…" value={search} onChange={e => setSearch(e.target.value)}/><button className="secondary-btn" onClick={loadAll}>Refresh</button></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th></tr></thead><tbody>{filtered(orders, ["id", "customer_name", "email", "phone", "status"]).map(o => <tr key={o.id}><td><strong>{o.id}</strong><small>{o.email}</small></td><td>{o.customer_name || "—"}<small>{o.phone || "—"}</small></td><td>{Array.isArray(o.items) ? o.items.reduce((n: number, i: Row) => n + Number(i.quantity || 0), 0) : "—"}</td><td><strong>{money(o.total)}</strong></td><td>{date(o.created_at)}</td><td><select value={o.status || "pending"} onChange={e => updateRow("orders", o.id, { status: e.target.value })}>{orderStatuses.map(s => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div></section>}

        {tab === "enquiries" && <section className="admin-panel"><div className="admin-toolbar"><input placeholder="Search enquiries…" value={search} onChange={e => setSearch(e.target.value)}/></div><div className="admin-card-list">{filtered(enquiries, ["name", "email", "phone", "service", "requirements", "status"]).map(e => <article className="admin-record" key={e.id}><div className="admin-record-head"><div><p className="eyebrow">{e.service || "GENERAL"}</p><h2>{e.name || "Unnamed enquiry"}</h2><p>{e.email || "—"} · {e.phone || "—"}</p></div><select value={e.status || "new"} onChange={x => updateRow("enquiries", e.id, { status: x.target.value })}>{enquiryStatuses.map(s => <option key={s}>{s}</option>)}</select></div><p>{e.requirements || "No requirements provided."}</p><small>{date(e.created_at)}</small><div className="admin-record-actions"><button onClick={() => { setQuoteForm({ enquiry_id: e.id || "", customer_name: e.name || "", email: e.email || "", phone: e.phone || "", title: e.service || "Project quotation", amount: "", status: "draft", notes: e.requirements || "", valid_until: "" }); setTab("quotations"); }}>Create quotation</button><button className="danger-btn" onClick={() => deleteRow("enquiries", e.id)}>Delete</button></div></article>)}{!enquiries.length && <p className="admin-muted">No enquiries yet.</p>}</div></section>}

        {tab === "quotations" && <><section className="admin-panel"><div className="admin-panel-head"><h2>Create quotation</h2><span>Turn an enquiry into a formal quote.</span></div><form className="admin-form-grid" onSubmit={saveQuote}><select value={quoteForm.enquiry_id} onChange={e => { const q = enquiries.find(x => x.id === e.target.value); setQuoteForm(f => ({ ...f, enquiry_id: e.target.value, customer_name: q?.name || f.customer_name, email: q?.email || f.email, phone: q?.phone || f.phone, notes: q?.requirements || f.notes, title: q?.service || f.title })); }}><option value="">Link an enquiry (optional)</option>{enquiries.map(e => <option key={e.id} value={e.id}>{e.name} — {e.service || "Enquiry"}</option>)}</select><input placeholder="Customer name" value={quoteForm.customer_name} onChange={e => setQuoteForm(f => ({ ...f, customer_name: e.target.value }))}/><input placeholder="Email" value={quoteForm.email} onChange={e => setQuoteForm(f => ({ ...f, email: e.target.value }))}/><input placeholder="Phone" value={quoteForm.phone} onChange={e => setQuoteForm(f => ({ ...f, phone: e.target.value }))}/><input placeholder="Quote title" value={quoteForm.title} onChange={e => setQuoteForm(f => ({ ...f, title: e.target.value }))}/><input type="number" min="0" placeholder="Amount" value={quoteForm.amount} onChange={e => setQuoteForm(f => ({ ...f, amount: e.target.value }))}/><select value={quoteForm.status} onChange={e => setQuoteForm(f => ({ ...f, status: e.target.value }))}>{quoteStatuses.map(s => <option key={s}>{s}</option>)}</select><input type="date" value={quoteForm.valid_until} onChange={e => setQuoteForm(f => ({ ...f, valid_until: e.target.value }))}/><textarea className="wide" placeholder="Notes / scope / terms" value={quoteForm.notes} onChange={e => setQuoteForm(f => ({ ...f, notes: e.target.value }))}/><button className="primary-btn" type="submit">Create quotation</button></form></section><section className="admin-panel"><div className="admin-toolbar"><input placeholder="Search quotations…" value={search} onChange={e => setSearch(e.target.value)}/></div><div className="admin-card-list">{filtered(quotations, ["customer_name", "email", "phone", "title", "status"]).map(q => <article className="admin-record" key={q.id}><div className="admin-record-head"><div><p className="eyebrow">QUOTATION</p><h2>{q.title || "Quotation"}</h2><p>{q.customer_name} · {q.email || "—"} · {q.phone || "—"}</p></div><strong>{money(q.amount)}</strong></div><p>{q.notes || "No notes."}</p><div className="admin-record-actions"><select value={q.status || "draft"} onChange={e => updateRow("quotations", q.id, { status: e.target.value })}>{quoteStatuses.map(s => <option key={s}>{s}</option>)}</select><button className="danger-btn" onClick={() => deleteRow("quotations", q.id)}>Delete</button></div></article>)}</div></section></>}

        {tab === "products" && <section className="admin-panel"><div className="admin-panel-head"><h2>Glass products</h2><button className="primary-btn" onClick={() => setProductForm({ name: "", description: "", mrp: 0, offer_price: 0, stock: 0, category: "", image_url: "" })}>+ Add product</button></div><div className="admin-card-list">{filtered(products, ["name", "category", "description"]).map(p => <article className="admin-record" key={p.id}><div className="admin-record-head"><div><p className="eyebrow">{p.category}</p><h2>{p.name}</h2><p>{p.description}</p></div><strong>{money(p.offer_price ?? p.price ?? p.mrp)}</strong></div><p>MRP {money(p.mrp)} · Stock {p.stock}</p><div className="admin-record-actions"><button onClick={() => setProductForm({ ...p })}>Edit</button><button className="danger-btn" onClick={() => deleteRow("products", p.id)}>Delete</button></div></article>)}{!products.length && <p className="admin-muted">No products.</p>}</div></section>}

        {tab === "hardware" && <><section className="admin-panel"><div className="admin-panel-head"><div><h2>Hardware products</h2><span>{hardwareProducts.length} brands · {hardwareVariants.length} variants</span></div><button className="primary-btn" onClick={() => setHardwareForm({ group_name: "", category_name: "", brand: "", image_url: "", active: true })}>+ Add brand</button></div><div className="admin-toolbar"><input placeholder="Search hardware…" value={search} onChange={e => setSearch(e.target.value)}/></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Group</th><th>Category</th><th>Brand</th><th>MRP</th><th>Active</th><th></th></tr></thead><tbody>{filtered(hardwareProducts, ["group_name", "category_name", "brand"]).map(h => <tr key={h.id}><td>{h.group_name}</td><td>{h.category_name}</td><td><strong>{h.brand}</strong></td><td>{money(h.mrp)}</td><td><input type="checkbox" checked={h.active !== false} onChange={e => updateRow("hardware_products", h.id, { active: e.target.checked })}/></td><td><button onClick={() => setHardwareForm({ ...h })}>Edit</button><button className="danger-btn" onClick={() => deleteRow("hardware_products", h.id)}>Delete</button></td></tr>)}</tbody></table></div></section><section className="admin-panel"><div className="admin-panel-head"><h2>Hardware variants & stock</h2><button className="secondary-btn" onClick={() => setVariantForm({ hardware_product_id: hardwareProducts[0]?.id || "", size: "Standard", material: "Standard", finish: "Standard", stock: 0, active: true })}>+ Add variant</button></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Brand</th><th>Size</th><th>Material</th><th>Finish</th><th>Stock</th><th>Active</th><th></th></tr></thead><tbody>{filtered(hardwareVariants, ["size", "material", "finish", "stock"]).slice(0, 300).map(v => { const hp = hardwareProducts.find(x => x.id === v.hardware_product_id); return <tr key={v.id}><td>{hp?.brand || v.hardware_product_id}</td><td>{v.size}</td><td>{v.material}</td><td>{v.finish}</td><td><strong>{v.stock}</strong></td><td><input type="checkbox" checked={v.active !== false} onChange={e => updateRow("hardware_variants", v.id, { active: e.target.checked })}/></td><td><button onClick={() => setVariantForm({ ...v })}>Edit</button><button className="danger-btn" onClick={() => deleteRow("hardware_variants", v.id)}>Delete</button></td></tr>; })}</tbody></table></div></section></>}

        {tab === "users" && <section className="admin-panel"><div className="admin-toolbar"><input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)}/></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Role</th><th>Points</th><th>Created</th><th></th></tr></thead><tbody>{filtered(profiles, ["email", "role", "id"]).map(p => <tr key={p.id}><td><strong>{p.name || p.email || p.id}</strong><small>{p.email || "—"}</small></td><td><select value={p.role || "customer"} onChange={e => updateRow("profiles", p.id, { role: e.target.value })}>{roles.map(r => <option key={r}>{r}</option>)}</select></td><td><input className="admin-small-input" type="number" value={p.points ?? 0} onChange={e => updateRow("profiles", p.id, { points: Number(e.target.value) || 0 })}/></td><td>{date(p.created_at)}</td><td><button className="danger-btn" onClick={() => deleteRow("profiles", p.id)}>Delete profile</button></td></tr>)}</tbody></table></div><p className="admin-muted">This manages public profile records. Supabase Auth user deletion is intentionally separate because Auth users are not exposed through the normal client Data API.</p></section>}
      </>}
    </section>

    {productForm && <div className="admin-modal"><form className="admin-modal-card" onSubmit={saveProduct}><div className="admin-panel-head"><h2>{productForm.id ? "Edit product" : "Add product"}</h2><button type="button" onClick={() => setProductForm(null)}>×</button></div>{[["name","Name"],["category","Category"],["mrp","MRP"],["offer_price","Offer price"],["stock","Stock"],["image_url","Image URL"]].map(([key,label]) => <label key={key}>{label}<input value={productForm[key] ?? ""} onChange={e => setProductForm(f => ({ ...f, [key]: e.target.value }))}/></label>)}<label>Description<textarea value={productForm.description ?? ""} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}/></label><button className="primary-btn" type="submit">Save product</button></form></div>}
    {hardwareForm && <div className="admin-modal"><form className="admin-modal-card" onSubmit={saveHardwareProduct}><div className="admin-panel-head"><h2>{hardwareForm.id ? "Edit hardware brand" : "Add hardware brand"}</h2><button type="button" onClick={() => setHardwareForm(null)}>×</button></div>{[["group_name","Group"],["category_name","Category"],["brand","Brand"],["image_url","Image URL"]].map(([key,label]) => <label key={key}>{label}<input value={hardwareForm[key] ?? ""} onChange={e => setHardwareForm(f => ({ ...f, [key]: e.target.value }))}/></label>)}<label className="check-label"><input type="checkbox" checked={hardwareForm.active !== false} onChange={e => setHardwareForm(f => ({ ...f, active: e.target.checked }))}/> Active</label><button className="primary-btn" type="submit">Save hardware brand</button></form></div>}
    {variantForm && <div className="admin-modal"><form className="admin-modal-card" onSubmit={saveVariant}><div className="admin-panel-head"><h2>{variantForm.id ? "Edit variant" : "Add variant"}</h2><button type="button" onClick={() => setVariantForm(null)}>×</button></div><label>Hardware product<select value={variantForm.hardware_product_id ?? ""} onChange={e => setVariantForm(f => ({ ...f, hardware_product_id: e.target.value }))}>{hardwareProducts.map(h => <option key={h.id} value={h.id}>{h.brand} — {h.category_name}</option>)}</select></label>{[["size","Size"],["material","Material"],["finish","Finish"],["stock","Stock"]].map(([key,label]) => <label key={key}>{label}<input value={variantForm[key] ?? ""} onChange={e => setVariantForm(f => ({ ...f, [key]: e.target.value }))}/></label>)}<label className="check-label"><input type="checkbox" checked={variantForm.active !== false} onChange={e => setVariantForm(f => ({ ...f, active: e.target.checked }))}/> Active</label><button className="primary-btn" type="submit">Save variant</button></form></div>}
  </main>;
}
