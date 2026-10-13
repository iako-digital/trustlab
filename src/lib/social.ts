/** Public site and bot addresses shared by the header, footer, home sections and the Telegram bot. */
export const TELEGRAM_BOT = (process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "trustlab_bot").replace(/^@/, "");
export const TELEGRAM_URL = `https://t.me/${TELEGRAM_BOT}`;

/** Canonical site origin for links sent outside the site (e.g. in Telegram replies). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustlab-iota.vercel.app").replace(/\/+$/, "");
