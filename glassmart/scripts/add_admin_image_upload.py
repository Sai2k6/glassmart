from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / "src" / "AdminDashboard.tsx"
s = path.read_text(encoding="utf-8")

if 'glassmart-images' not in s:
    s = s.replace('  const notify = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(""), 2800); };', '''  const notify = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(""), 2800); };

  const uploadImage = async (file: File, setForm: (fn: (value: Row | null) => Row | null) => void) => {
    if (!file.type.startsWith("image/")) return notify("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return notify("Image must be smaller than 5 MB.");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `catalog/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("glassmart-images").upload(filePath, file, { upsert: true, contentType: file.type });
    if (error) return notify(`Image upload failed: ${error.message}`);
    const { data } = supabase.storage.from("glassmart-images").getPublicUrl(filePath);
    setForm(value => ({ ...(value || {}), image_url: data.publicUrl }));
    notify("Image uploaded successfully");
  };''')

old_product = '{[["name","Name"],["category","Category"],["mrp","MRP"],["offer_price","Offer price"],["stock","Stock"],["image_url","Image URL"]].map(([key,label]) => <label key={key}>{label}<input value={productForm[key] ?? ""} onChange={e => setProductForm(f => ({ ...f, [key]: e.target.value }))}/></label>)}'
new_product = '{[["name","Name"],["category","Category"],["mrp","MRP"],["offer_price","Offer price"],["stock","Stock"]].map(([key,label]) => <label key={key}>{label}<input value={productForm[key] ?? ""} onChange={e => setProductForm(f => ({ ...f, [key]: e.target.value }))}/></label>)}<label>Product image<input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) uploadImage(file, setProductForm); }}/></label>{productForm.image_url && <div className="admin-image-preview"><img src={productForm.image_url} alt="Product preview"/></div>}'
if old_product in s:
    s = s.replace(old_product, new_product, 1)

old_hardware = '{[["group_name","Group"],["category_name","Category"],["brand","Brand"],["image_url","Image URL"]].map(([key,label]) => <label key={key}>{label}<input value={hardwareForm[key] ?? ""} onChange={e => setHardwareForm(f => ({ ...f, [key]: e.target.value }))}/></label>)}'
new_hardware = '{[["group_name","Group"],["category_name","Category"],["brand","Brand"]].map(([key,label]) => <label key={key}>{label}<input value={hardwareForm[key] ?? ""} onChange={e => setHardwareForm(f => ({ ...f, [key]: e.target.value }))}/></label>}<label>Product image<input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) uploadImage(file, setHardwareForm); }}/></label>{hardwareForm.image_url && <div className="admin-image-preview"><img src={hardwareForm.image_url} alt="Hardware preview"/></div>}'
if old_hardware in s:
    s = s.replace(old_hardware, new_hardware, 1)

path.write_text(s, encoding="utf-8")

css = root / "src" / "App.css"
css.write_text(css.read_text(encoding="utf-8") + '''\n\n.admin-image-preview{margin:4px 0 10px;border:1px solid var(--line);border-radius:10px;padding:8px;background:#f7f9fb}.admin-image-preview img{display:block;width:100%;max-height:190px;object-fit:contain;border-radius:7px}.admin-modal-card input[type="file"]{padding:10px;background:#f7f9fb}\n''', encoding="utf-8")
print("Admin product and hardware image uploads enabled")
