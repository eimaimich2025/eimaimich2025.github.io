// Port of atlas-variance/server.ts drawer generation → static files.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2]; // atlas-variance dir
const OUT = process.argv[3]; // dist dir

const BR = JSON.parse(readFileSync(join(SRC, "data", "business-registries.json"), "utf-8"));

const STATUS_LABEL = { active: "Full coverage", in_progress: "Partial coverage", proposed: "Basic coverage", none: "No coverage" };
const VARIANT = { active: "green", in_progress: "lavender", proposed: "yellow", none: "grey" };

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const chip = (on) => on ? `<span class="sticker sticker-green">Available</span>` : `<span class="sticker sticker-grey">Not available</span>`;
const attr = (label, value) => `<div class="legislation-card-attr"><div class="legislation-card-attr-label-wrap"><span class="legislation-card-attr-label">${esc(label)}</span></div><div class="legislation-card-attr-value">${value}</div></div>`;
const attrs = (source) => {
  const st = source.status;
  return [
    attr("STATUS", `<span class="sticker sticker-${VARIANT[st] || "grey"}">${STATUS_LABEL[st] || "—"}</span>`),
    attr("BUSINESS INFO", chip(source.biz)),
    attr("OFFICERS", chip(source.officers)),
    attr("SHAREHOLDERS", chip(source.shareholders)),
  ].join("");
};
const card = (org, title, summary, source) =>
  `<div class="legislation-card"><div class="legislation-card-header"><div class="legislation-card-org">${esc(org)}</div><h3 class="legislation-card-title">${esc(title)}</h3><p class="legislation-card-summary">${esc(summary)}</p></div><div class="legislation-card-attrs"><div class="legislation-card-attrs-list">${attrs(source)}</div></div></div>`;
const page = (name, tabsHtml, panelsHtml) =>
  `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(name)} - Business Registry</title></head><body><div class="modal-content"><div class="detail-layout"><div class="drawer-sticky-header"><div class="drawer-top-row"><a href="/" class="back-link">← Back</a><div class="last-updated">Last updated ${BR.generated}</div></div><div class="drawer-tabs" role="tablist">${tabsHtml}</div></div><div class="detail-header"><h1 class="region-name">${esc(name)}</h1></div>${panelsHtml}</div></div></body></html>`;

function summaryFor(c, isFederal) {
  const bits = [
    c.national ? "business information" : null,
    c.national?.officers ? "officer data" : null,
    c.national?.shareholders ? "shareholder / ownership data" : null,
  ].filter(Boolean);
  if (isFederal && c.regions.length) {
    return `Federal registry: ${c.national.source}. Provincial/state registries provide additional coverage across ${c.regions.length} jurisdictions. Coverage of officers and shareholders varies by region.`;
  }
  return `Provides company registration records. Available data: ${bits.join(", ") || "business information"}.`;
}

function drawerNational(cc) {
  const c = BR.countries[cc.toUpperCase()];
  if (!c) return null;
  const tabs = c.regions.length
    ? `<span class="drawer-tab drawer-tab-static drawer-tab-active">REGISTRY (1)</span><span class="drawer-tab drawer-tab-static drawer-tab-resources">JURISDICTIONS (${c.regions.length})</span>`
    : `<span class="drawer-tab drawer-tab-static drawer-tab-active">REGISTRY (1)</span>`;
  const isFederal = !!c.national && c.regions.length > 0;
  const nat = c.national || {
    code: cc, name: c.name,
    source: "State-level registries (varies by jurisdiction)",
    biz: c.regions.some((r) => r.biz),
    officers: c.regions.some((r) => r.officers),
    shareholders: c.regions.some((r) => r.shareholders),
    status: c.national_status,
  };
  const cards = card("BUSINESS REGISTRY", nat.source, summaryFor(c, isFederal), nat);
  const jurisdictionsPanel = c.regions.length
    ? `<div id="panel-resources" class="drawer-tab-panel" role="tabpanel"><div class="legislation-cards-grid" style="display:block"><div class="section"><div class="section-content"><p class="text-sm text-secondary" style="margin-bottom:12px">Coverage is tracked across ${c.regions.length} jurisdictions:</p><div class="sticker-group">${c.regions.map((r) => `<div><span class="sticker sticker-${VARIANT[r.status] || "grey"}">${esc(r.name)}</span></div>`).join("")}</div></div></div></div></div>`
    : "";
  const panels = `<div id="panel-legislations" class="drawer-tab-panel" role="tabpanel"><div class="legislation-cards-grid">${cards}</div></div>${jurisdictionsPanel}`;
  return page(c.name, tabs, panels);
}

function drawerSubnational(cc, rc) {
  const c = BR.countries[cc.toUpperCase()];
  if (!c) return null;
  const r = c.regions.find((x) => x.code.toLowerCase() === rc.toLowerCase());
  if (!r) return null;
  const tabs = `<span class="drawer-tab drawer-tab-static drawer-tab-active">REGISTRY (1)</span>`;
  const fullName = `${r.name}, ${c.name}`;
  const summary = `${r.source} maintains the business registry for ${r.name}. Available data: ${[
    "business information", r.officers ? "officer data" : null, r.shareholders ? "shareholder / ownership data" : null,
  ].filter(Boolean).join(", ")}.`;
  const cards = card("BUSINESS REGISTRY", r.source, summary, r);
  const panels = `<div id="panel-legislations" class="drawer-tab-panel" role="tabpanel"><div class="legislation-cards-grid">${cards}</div></div>`;
  return page(fullName, tabs, panels);
}

let n = 0;
for (const cc of Object.keys(BR.countries)) {
  const dir = join(OUT, "region", cc.toLowerCase());
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), drawerNational(cc));
  n++;
  for (const r of BR.countries[cc].regions) {
    const rdir = join(OUT, "country", cc.toLowerCase(), "region", r.code.toLowerCase());
    mkdirSync(rdir, { recursive: true });
    writeFileSync(join(rdir, "index.html"), drawerSubnational(cc, r.code));
    n++;
  }
}
console.log(`prerendered ${n} drawer pages`);
