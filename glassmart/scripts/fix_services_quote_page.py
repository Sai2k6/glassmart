from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
app_path = root / "src" / "App.tsx"
css_path = root / "src" / "App.css"

app = app_path.read_text(encoding="utf-8")

start_marker = 'page === "services" ?'
end_marker = ': page === "contact" ?'
start = app.find(start_marker)
if start == -1:
    raise SystemExit("services page marker not found")
end = app.find(end_marker, start)
if end == -1:
    raise SystemExit("contact page marker not found after services page")

new_services = '''page === "services" ? (
        <div className="services-quote-page">
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

            <form
              className="services-quote-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!enquiry.name || !enquiry.phone || !enquiry.email || !enquiry.service || !enquiry.requirements) {
                  setEnquiryMessage("Please fill in all fields.");
                  return;
                }
                setEnquiryLoading(true);
                setEnquiryMessage("");
                const { error } = await supabase.from("enquiries").insert({
                  name: enquiry.name,
                  phone: enquiry.phone,
                  email: enquiry.email,
                  service: enquiry.service,
                  requirements: enquiry.requirements,
                });
                if (error) setEnquiryMessage(error.message);
                else {
                  setEnquiryMessage("Enquiry submitted successfully. Our team will get back to you.");
                  notify("Enquiry submitted successfully");
                  setEnquiry({ name: "", phone: "", email: "", service: "", requirements: "" });
                }
                setEnquiryLoading(false);
              }}
            >
              <label>Name<input value={enquiry.name} onChange={e => setEnquiry(v => ({ ...v, name: e.target.value }))} placeholder="Your name" /></label>
              <label>Phone<input value={enquiry.phone} onChange={e => setEnquiry(v => ({ ...v, phone: e.target.value }))} placeholder="Phone number" /></label>
              <label>Email<input type="email" value={enquiry.email} onChange={e => setEnquiry(v => ({ ...v, email: e.target.value }))} placeholder="Email address" /></label>
              <label>Service required<select value={enquiry.service} onChange={e => setEnquiry(v => ({ ...v, service: e.target.value }))}><option value="">Select a service</option>{SERVICES.map(service => <option key={service} value={service}>{service}</option>)}</select></label>
              <label className="services-quote-requirements">Requirements<textarea value={enquiry.requirements} onChange={e => setEnquiry(v => ({ ...v, requirements: e.target.value }))} placeholder="Tell us what you need" /></label>
              <div className="services-quote-submit"><button className="primary-btn" type="submit" disabled={enquiryLoading}>{enquiryLoading ? "Submitting..." : "Submit Enquiry"}</button></div>
              {enquiryMessage && <div className={enquiryMessage.toLowerCase().includes("success") ? "form-success services-quote-message" : "form-error services-quote-message"}>{enquiryMessage}</div>}
            </form>
          </div>
        </div>
      ) '''

app = app[:start] + new_services + app[end:]
app_path.write_text(app, encoding="utf-8")

css = css_path.read_text(encoding="utf-8")
marker = "/* Glassmart services quote page */"
if marker not in css:
    css += '''\n\n/* Glassmart services quote page */
.services-quote-page{width:100%;max-width:1450px;margin:0 auto;padding:48px 36px 80px;min-height:650px}
.services-quote-intro{margin:0 0 68px}
.services-quote-eyebrow{margin:0 0 18px;color:#59728e;font-size:16px;font-weight:900;letter-spacing:5px;line-height:1.2}
.services-quote-intro h1{margin:0 0 18px;color:var(--navy);font-size:60px;line-height:1.08;letter-spacing:-1.5px}
.services-quote-intro>p:last-child{margin:0;color:#55708d;font-size:23px;line-height:1.45}
.services-quote-card{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:70px;background:#fff;border:1px solid #d5dde6;border-radius:16px;padding:64px 70px;box-shadow:0 3px 14px #142d4608}
.services-quote-copy{padding-top:12px}
.services-quote-copy .services-quote-eyebrow{margin-bottom:25px}
.services-quote-copy h2{margin:0 0 28px;color:var(--navy);font-size:54px;line-height:1.08;letter-spacing:-1px}
.services-quote-copy>p:last-child{max-width:540px;margin:0;color:#55708d;font-size:21px;line-height:1.7}
.services-quote-form{display:grid;grid-template-columns:1fr 1fr;column-gap:28px;row-gap:30px;align-content:start}
.services-quote-form label{display:block;color:#123b65;font-size:16px;font-weight:800;line-height:1.3}
.services-quote-form input,.services-quote-form select,.services-quote-form textarea{width:100%;margin-top:10px;padding:16px 18px;border:1px solid #c7d2df;border-radius:7px;background:#fff;color:#173b63;outline:none;font-size:17px}
.services-quote-form input,.services-quote-form select{height:60px}
.services-quote-form input:focus,.services-quote-form select:focus,.services-quote-form textarea:focus{border-color:#5d7894;box-shadow:0 0 0 3px #173b6310}
.services-quote-form textarea{height:150px;resize:vertical;min-height:150px}
.services-quote-requirements{grid-column:1/-1}
.services-quote-submit{grid-column:1/-1;display:flex;align-items:center;gap:18px}
.services-quote-submit .primary-btn{background:#df302f;padding:16px 34px;border-radius:7px;font-size:18px;min-width:218px}
.services-quote-submit .primary-btn:hover{background:#c92624}
.services-quote-message{grid-column:1/-1;margin-top:-8px}
@media(max-width:900px){.services-quote-card{grid-template-columns:1fr;gap:40px;padding:45px}.services-quote-copy h2{font-size:46px}}
@media(max-width:680px){.services-quote-page{padding:32px 18px 60px}.services-quote-intro{margin-bottom:40px}.services-quote-intro h1{font-size:42px}.services-quote-intro>p:last-child{font-size:18px}.services-quote-card{padding:30px 22px;border-radius:12px}.services-quote-copy h2{font-size:38px}.services-quote-copy>p:last-child{font-size:18px}.services-quote-form{grid-template-columns:1fr;row-gap:22px}.services-quote-requirements,.services-quote-submit,.services-quote-message{grid-column:auto}.services-quote-submit .primary-btn{width:100%}}
'''
    css_path.write_text(css, encoding="utf-8")
