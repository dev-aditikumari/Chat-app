export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (err?.response?.data?.msg) return err.response.data.msg;
  if (err?.request && !err.response) return "Cannot reach the server. Check that it is running.";
  return fallback;
}
