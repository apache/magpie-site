import BrandName from "./BrandName";
import { withBase } from "@/ui/lib/utils";

const columns = [
  { title: "Explore", links: [["Documentation", "/docs"], ["Learning guides", "/resources"], ["Architecture", "/architecture"], ["Tools", "/tools"], ["Downloads", "/downloads"], ["Brand assets", "/brand"]] },
  { title: "Take part", links: [["Contributing", "https://github.com/apache/magpie/blob/main/CONTRIBUTING.md"], ["Mailing list", "https://lists.apache.org/list.html?dev@magpie.apache.org"], ["Discord", "https://discord.gg/bfVyXTgak"], ["Issue tracker", "https://github.com/apache/magpie/issues"], ["Changelog", "https://github.com/apache/magpie/releases"]] },
  { title: "Apache", links: [["The Foundation", "https://www.apache.org/"], ["License", "https://www.apache.org/licenses/"], ["Events", "https://www.apache.org/events/current-event"], ["Security", "https://www.apache.org/security/"], ["Privacy", "https://privacy.apache.org/policies/privacy-policy-public.html"], ["Sponsorship", "https://www.apache.org/foundation/sponsorship.html"], ["Thanks", "https://www.apache.org/foundation/thanks.html"]] },
];
export function SiteFooter() {
  return <footer className="site-footer"><div className="container footer-grid">
    <div className="footer-intro"><a className="brand-lockup" href={withBase("/")} aria-label="Apache Magpie home"><img className="official-wordmark" src={withBase("/wordmark.svg")} alt="Apache Magpie" width="160" height="45" /></a><span className="footer-asf">An Apache Software Foundation project.</span></div>
    {columns.map(col => <div key={col.title} className="footer-column"><h2>{col.title}</h2>{col.links.map(([label, href]) => <a key={label} href={href.startsWith("/") ? withBase(href) : href} {...((!href.startsWith("/") || href.startsWith("/docs")) ? { target: "_blank", rel: "noreferrer" } : {})}>{label}</a>)}</div>)}
  </div><div className="container footer-bottom"><p>© 2026 The Apache Software Foundation. Licensed under Apache 2.0.</p><p>Apache <BrandName />, <BrandName />, and Apache are trademarks of The Apache Software Foundation.</p></div></footer>;
}
