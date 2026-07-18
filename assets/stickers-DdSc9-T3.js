const n = {
  active: { label: "Full coverage", variant: "green" },
  blocked: { label: "Blocked", variant: "red" },
  in_progress: { label: "Partial coverage", variant: "lavender" },
  none: { label: "None", variant: "white" },
  pending: { label: "Pending", variant: "blue" },
  proposed: { label: "Basic coverage", variant: "yellow" },
  stayed: { label: "Stayed", variant: "orange" }
}, l = Object.fromEntries(
  Object.entries(n).map(([e, a]) => [e, a.label])
), i = Object.fromEntries(
  Object.entries(n).map(([e, a]) => [
    e,
    t(a.variant)
  ])
), r = {
  "Closed Beta": { label: "Closed Beta", variant: "blue" },
  Contracting: { label: "Contracting", variant: "grey" },
  GA: { label: "GA", variant: "green" },
  "In Development": { label: "In Development", variant: "yellow" },
  "Not started": { label: "Not started", variant: "dark-grey" },
  "Open Beta": { label: "Open Beta", variant: "teal" },
  "Pending on Integration": { label: "Pending on Integration", variant: "orange" },
  Researching: { label: "Researching", variant: "grey" }
};
Object.fromEntries(
  Object.entries(r).map(([e, a]) => [
    e,
    t(a.variant)
  ])
);
function t(e) {
  return "sticker-" + e;
}
export {
  n as S,
  i as a,
  l as b
};
//# sourceMappingURL=stickers-DdSc9-T3.js.map
