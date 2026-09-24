from pathlib import Path

root = Path(__file__).resolve().parents[1]
app = root / "src" / "App.tsx"
css = root / "src" / "App.css"

text = app.read_text(encoding="utf-8")

if "AdminDashboard" in text:
    print("Admin dashboard route already present.")
    raise SystemExit(0)

if 'import AdminDashboard from "./AdminDashboard";' not in text:
    text = text.replace('import "./App.css";', 'import "./App.css";\nimport AdminDashboard from "./AdminDashboard";')

new_admin = '{userRole === "admin" && page.startsWith("admin") && <AdminDashboard navigate={navigate} onLogout={logout} />}'
admin_start = text.find('{page === "admin" &&')
toast_marker = '\n    {toast &&'
if admin_start != -1:
    toast_start = text.find(toast_marker, admin_start)
    if toast_start != -1:
        text = text[:admin_start] + new_admin + text[toast_start:]

app.write_text(text, encoding="utf-8")
print("Admin dashboard applied")
