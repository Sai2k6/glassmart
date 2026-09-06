from pathlib import Path

root = Path(__file__).resolve().parents[1]
app = root / "src" / "App.tsx"
css = root / "src" / "App.css"

text = app.read_text(encoding="utf-8")

if 'import AdminDashboard from "./AdminDashboard";' not in text:
    text = text.replace('import "./App.css";', 'import "./App.css";\nimport AdminDashboard from "./AdminDashboard";')

old_admin = '{page === "admin" && <main className="page-container"><div className="admin-dashboard"><h1>Admin Dashboard</h1><div className="admin-grid"><button className="admin-card" onClick={() => navigate("admin-products")}><h2>Products</h2></button><button className="admin-card" onClick={() => navigate("admin-orders")}><h2>Orders</h2></button><button className="admin-card" onClick={() => navigate("admin-enquiries")}><h2>Enquiries</h2></button><button className="admin-card" onClick={() => navigate("admin-hardware")}><h2>Hardware</h2></button></div></div></main>}'
new_admin = '{userRole === "admin" && page.startsWith("admin") && <AdminDashboard navigate={navigate} onLogout={logout} />}'
if old_admin in text:
    text = text.replace(old_admin, new_admin)
else:
    if new_admin not in text:
        raise SystemExit("Existing admin dashboard block not found; refusing to make a risky edit")

# Admin can be selected in the registration UI, but a public signup must never self-assign admin privileges.
text = text.replace(
    'role: accountType, points: 0',
    'role: accountType === "admin" ? "customer" : accountType, points: 0'
)
text = text.replace(
    'notify("Account created. Check your email if verification is enabled."); setAuthMode("login");',
    'notify(accountType === "admin" ? "Account created. Admin access requires approval." : "Account created. Check your email if verification is enabled."); setAuthMode("login");'
)

app.write_text(text, encoding="utf-8")

styles = r'''

/* Admin control centre */
.admin-shell{min-height:calc(100vh - 80px);display:grid;grid-template-columns:240px 1fr;background:#f1f0eb;color:#1e1e1c}
.admin-sidebar{background:#122f50;color:#fff;padding:28px 18px;display:flex;flex-direction:column;min-height:calc(100vh - 80px);position:sticky;top:0;height:calc(100vh - 80px)}
.admin-brand{font-weight:900;letter-spacing:.18em;font-size:20px;padding:4px 12px 28px}.admin-brand span{color:#ef3434}.admin-brand small{display:block;color:#b8c5d2;letter-spacing:0;font-size:11px;font-weight:500;margin-top:7px}
.admin-sidebar nav{display:grid;gap:6px}.admin-sidebar nav button,.admin-sidebar-bottom button{border:0;background:transparent;color:#dce5ed;text-align:left;padding:12px 13px;border-radius:9px;font-size:14px;cursor:pointer}.admin-sidebar nav button:hover,.admin-sidebar nav button.active{background:#234a73;color:#fff}.admin-sidebar-bottom{margin-top:auto;display:grid;gap:5px;border-top:1px solid rgba(255,255,255,.14);padding-top:15px}
.admin-content{padding:34px;max-width:1500px;width:100%;margin:0 auto}.admin-topbar{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px}.admin-topbar h1{margin:2px 0 0;font-size:34px}.admin-top-actions{display:flex;gap:10px}.admin-alert{background:#fff3d6;border:1px solid #e1c77e;padding:12px 15px;border-radius:10px;margin-bottom:18px}.admin-loading{padding:80px;text-align:center;color:#6e6c64}
.admin-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:22px}.admin-stat{border:1px solid #c7c3b6;background:#fff;border-radius:12px;padding:18px;text-align:left;cursor:pointer}.admin-stat:hover{border-color:#2f5d7c;transform:translateY(-1px)}.admin-stat span{display:block;color:#6e6c64;font-size:13px}.admin-stat strong{display:block;font-size:30px;color:#1d456d;margin-top:6px}
.admin-two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px}.admin-panel{background:#fff;border:1px solid #c7c3b6;border-radius:12px;padding:20px;margin-bottom:18px}.admin-panel-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:16px}.admin-panel-head h2{margin:0;font-size:19px}.admin-panel-head span{color:#6e6c64;font-size:13px}.admin-panel-head button{border:0;background:none;color:#1d456d;font-weight:700;cursor:pointer}
.admin-list-row{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:12px;padding:13px 0;border-top:1px solid #ece9e0}.admin-list-row strong,.admin-list-row small{display:block}.admin-list-row small{color:#6e6c64;margin-top:3px}.admin-list-row select,.admin-table select{border:1px solid #c7c3b6;border-radius:7px;padding:7px;background:#fff}.admin-muted{color:#6e6c64}.admin-toolbar{display:flex;gap:10px;margin-bottom:16px}.admin-toolbar input{flex:1}
.admin-table-wrap{overflow:auto}.admin-table{width:100%;border-collapse:collapse;font-size:14px}.admin-table th,.admin-table td{padding:12px 10px;border-bottom:1px solid #e9e6dd;text-align:left;vertical-align:middle}.admin-table th{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#6e6c64}.admin-table td small{display:block;color:#6e6c64;margin-top:3px}.admin-table td button{margin-right:7px}.admin-table input[type=checkbox]{width:18px;height:18px}.admin-small-input{width:80px}
.admin-card-list{display:grid;gap:12px}.admin-record{border:1px solid #e2ded3;border-radius:10px;padding:16px}.admin-record-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.admin-record h2{margin:3px 0 4px;font-size:18px}.admin-record p{margin:8px 0;color:#4f4d47}.admin-record small{color:#6e6c64}.admin-record-actions{display:flex;gap:8px;align-items:center;margin-top:14px}.admin-record-actions button,.admin-record-actions select{border:1px solid #c7c3b6;background:#fff;border-radius:7px;padding:8px 11px;cursor:pointer}.danger-btn{color:#a21d1d!important;border-color:#e3b5b5!important}
.admin-form-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.admin-form-grid .wide{grid-column:1/-1}.admin-form-grid button{justify-self:start}.admin-form-grid textarea{min-height:100px}.admin-form-grid input,.admin-form-grid select,.admin-form-grid textarea,.admin-modal-card input,.admin-modal-card select,.admin-modal-card textarea{width:100%;border:1px solid #c7c3b6;border-radius:8px;padding:11px;background:#fff;box-sizing:border-box}.admin-form-grid label,.admin-modal-card label{font-size:12px;color:#6e6c64;display:grid;gap:6px}
.admin-modal{position:fixed;inset:0;background:rgba(12,27,42,.48);display:grid;place-items:center;padding:20px;z-index:100}.admin-modal-card{background:#fff;border-radius:14px;padding:22px;width:min(560px,100%);max-height:90vh;overflow:auto;display:grid;gap:13px}.admin-modal-card .admin-panel-head{margin-bottom:4px}.admin-modal-card .admin-panel-head button{font-size:24px;color:#1e1e1c}.check-label{display:flex!important;grid-template-columns:auto 1fr;align-items:center;gap:8px!important}.check-label input{width:auto}
@media(max-width:1050px){.admin-shell{grid-template-columns:190px 1fr}.admin-stat-grid{grid-template-columns:repeat(2,1fr)}.admin-two-col{grid-template-columns:1fr}.admin-form-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:700px){.admin-shell{display:block}.admin-sidebar{position:relative;height:auto;min-height:0}.admin-sidebar nav{display:flex;overflow:auto}.admin-sidebar nav button{white-space:nowrap}.admin-content{padding:18px}.admin-topbar{align-items:flex-start;flex-direction:column}.admin-top-actions{width:100%}.admin-stat-grid{grid-template-columns:1fr 1fr}.admin-form-grid{grid-template-columns:1fr}.admin-list-row{grid-template-columns:1fr auto}.admin-list-row select{grid-column:1/-1}.admin-record-head{flex-direction:column}}
'''
existing = css.read_text(encoding="utf-8")
if "/* Admin control centre */" not in existing:
    css.write_text(existing + styles, encoding="utf-8")
'''
