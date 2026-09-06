from pathlib import Path

root = Path(__file__).resolve().parents[1]
css = root / "src" / "App.css"

text = css.read_text(encoding="utf-8")
marker = "/* Glassmart services page repair */"

if marker not in text:
    text += r'''

/* Glassmart services page repair */
.page-container:has(.services-intro){display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;align-items:stretch;}
.page-container:has(.services-intro) .services-intro{grid-column:1/-1;margin:0 0 8px;}
.page-container:has(.services-intro) .services-intro h1{font-size:48px;line-height:1.08;margin:6px 0 12px;}
.page-container:has(.services-intro) .services-intro p{font-size:18px;line-height:1.55;margin:0;color:#617287;}
.page-container:has(.services-intro) .service-layout{display:contents;}
.page-container:has(.services-intro) .service-info{background:#fff;border:1px solid var(--line);border-radius:12px;padding:26px;min-height:170px;box-shadow:0 3px 12px #142d460b;}
.page-container:has(.services-intro) .service-info h2{font-size:26px;color:var(--navy);margin:0 0 8px;}
.page-container:has(.services-intro) .service-info p{font-size:15px;line-height:1.55;color:#617287;margin:0;}
.page-container:has(.services-intro) .primary-btn{grid-column:1/-1;justify-self:start;margin-top:2px;}
@media(max-width:760px){.page-container:has(.services-intro){grid-template-columns:1fr;}.page-container:has(.services-intro) .services-intro{grid-column:auto;}.page-container:has(.services-intro) .primary-btn{grid-column:auto;width:100%;}}
'''
    css.write_text(text, encoding="utf-8")
