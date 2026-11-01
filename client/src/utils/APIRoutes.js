export const host = process.env.REACT_APP_API_URL || "http://localhost:5200";
export const registerRoute = `${host}/api/auth/register`;
export const loginRoute = `${host}/api/auth/login`;
export const setAvatarRoute = `${host}/api/auth/setAvatar`;
export const allUserRoute = `${host}/api/auth/allusers`;
export const sendMessageRoute = `${host}/api/messages/add`;
export const getMessagesRoute = `${host}/api/messages`;
