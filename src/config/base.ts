export const baseMsg =
  process.env.NODE_ENV === "dev"
    ? await import("@/config/config_dev.json")
    : await import("@/config/config_prod.json");