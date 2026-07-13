// Lightweight JSON syntax highlighter → returns safe HTML (input is escaped first).
// Colors map to the site's theme tokens (keys=blue, strings=green, numbers=purple).

const escapeHtml = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function highlightJson(json: string): string {
  const escaped = escapeHtml(json);

  return escaped.replace(
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "text-purple"; // numbers
      if (match.startsWith('"')) {
        cls = /:\s*$/.test(match) ? "text-blue" : "text-lime"; // key vs string value
      } else if (match === "true" || match === "false") {
        cls = "text-icon-orange";
      } else if (match === "null") {
        cls = "text-dim";
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
}
