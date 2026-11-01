import axios from "axios";

const COLORS = ["#4e0eff", "#997af0", "#e8590c", "#2b8a3e", "#c2255c", "#1971c2", "#f08c00", "#0b7285"];

export function toBase64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

export function initialsSvg(letter, color) {
  const safe = (letter || "?").trim().charAt(0).toUpperCase() || "?";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${color}"/><text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Arial,sans-serif" font-size="52" fill="#fff">${safe}</text></svg>`;
}

export function localAvatars(username, count = 4, offset = Math.floor(Math.random() * COLORS.length)) {
  return Array.from({ length: count }, (_, i) =>
    toBase64(initialsSvg(username, COLORS[(offset + i * 2) % COLORS.length]))
  );
}

export async function remoteAvatars(apiBase, count = 4) {
  const result = [];
  for (let i = 0; i < count; i++) {
    const res = await axios.get(`${apiBase}/${Math.round(Math.random() * 1000)}`, {
      timeout: 4000,
      responseType: "text",
    });
    result.push(toBase64(res.data));
  }
  return result;
}

export function avatarSrc(image) {
  return `data:image/svg+xml;base64,${image}`;
}
