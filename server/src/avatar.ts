const COLORS = ["#4e0eff", "#997af0", "#e8590c", "#2b8a3e", "#c2255c", "#1971c2"];

export function initialsAvatar(name: string): string {
  const letter = (name.trim()[0] ?? "?").toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const color = COLORS[hash % COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${color}"/><text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Arial,sans-serif" font-size="52" fill="#fff">${letter}</text></svg>`;
  return Buffer.from(svg).toString("base64");
}
