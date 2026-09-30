const configuredApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Keep URL construction predictable when an environment value ends with `/`.
export const API_URL = configuredApiUrl.replace(/\/$/, "");

