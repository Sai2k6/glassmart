from pathlib import Path

# The final generated syntax repair owns the Services JSX replacement. This
# step intentionally does not search for a generic `page === "services" ?`
# expression because that text also exists in the navigation className ternary.
# Keeping this step as a safe no-op prevents the generator from corrupting the
# header while the final repair restores the requested Services page.
root = Path(__file__).resolve().parents[1]
css_path = root / "src" / "App.css"
css = css_path.read_text(encoding="utf-8")
if "services-quote-page" not in css:
    css += '''\n\n/* Glassmart services quote page */
.services-quote-page{width:100%;max-width:1450px;margin:0 auto;padding:52px 5.5% 80px;background:#fff;min-height:680px}.services-quote-intro{margin:0 0 62px}.services-quote-eyebrow{margin:0 0 18px;color:#59728e;font-size:16px;font-weight:900;letter-spacing:5px;line-height:1.2}.services-quote-intro h1{margin:0 0 18px;color:var(--navy);font-size:60px;line-height:1.08;letter-spacing:-1.5px}.services-quote-intro>p:last-child{margin:0;color:#55708d;font-size:23px;line-height:1.45}.services-quote-card{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:70px;background:#fff;border:1px solid #d5dde6;border-radius:16px;padding:64px 70px;box-shadow:0 3px 14px #142d4608}.services-quote-copy{padding-top:12px}.services-quote-copy .services-quote-eyebrow{margin-bottom:25px}.services-quote-copy h2{margin:0 0 28px;color:var(--navy);font-size:54px;line-height:1.08;letter-spacing:-1px}.services-quote-copy>p:last-child{max-width:540px;margin:0;color:#55708d;font-size:21px;line-height:1.7}.services-quote-form{display:grid;grid-template-columns:1fr 1fr;column-gap:28px;row-gap:30px;align-content:start}.services-quote-form label{display:block;color:#123b65;font-size:16px;font-weight:800;line-height:1.3}.services-quote-form input,.services-quote-form select,.services-quote-form textarea{width:100%;margin-top:10px;padding:16px 18px;border:1px solid #c7d2df;border-radius:7px;background:#fff;color:#173b63;outline:none;font-size:17px;box-sizing:border-box}.services-quote-form input,.services-quote-form select{height:60px}.services-quote-form textarea{height:150px;resize:vertical;min-height:150px}.services-quote-requirements,.services-quote-submit,.services-quote-message{grid-column:1/-1}.services-quote-submit{display:flex;align-items:center;gap:18px}.services-quote-submit .primary-btn{background:#df302f;padding:16px 34px;border-radius:7px;font-size:18px;min-width:218px}@media(max-width:1000px){.services-quote-card{grid-template-columns:1fr;gap:40px;padding:45px}.services-quote-copy h2{font-size:46px}}@media(max-width:650px){.services-quote-page{padding:32px 18px 60px}.services-quote-intro h1{font-size:42px}.services-quote-intro>p:last-child{font-size:18px}.services-quote-card{padding:30px 22px}.services-quote-copy h2{font-size:38px}.services-quote-form{grid-template-columns:1fr;row-gap:22px}.services-quote-requirements,.services-quote-submit,.services-quote-message{grid-column:auto}.services-quote-submit .primary-btn{width:100%}}
'''
    css_path.write_text(css, encoding="utf-8")
print("Services quote generator safely skipped JSX replacement")
