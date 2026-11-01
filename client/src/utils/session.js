const USER_KEY = "chat-app-user";
const TOKEN_KEY = "chat-app-token";

export function getSession() {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    const token = localStorage.getItem(TOKEN_KEY);
    return user && token ? { user, token } : null;
  } catch {
    return null;
  }
}

export function saveSession(user, token) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
