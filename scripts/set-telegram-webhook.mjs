// Registers (or removes) the Telegram bot webhook.
//
// Usage:  node scripts/set-telegram-webhook.mjs https://your-site.example   # set
//         node scripts/set-telegram-webhook.mjs --delete                    # remove
// Needs:  TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in the environment
//         (the same values configured on the server). Run with `node --env-file=.env.local ...`.

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const arg = process.argv[2];

if (!token || !secret || !arg) {
  console.error("Usage: node --env-file=.env.local scripts/set-telegram-webhook.mjs <https://site-origin | --delete>");
  console.error("Needs TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET.");
  process.exit(1);
}
if (!/^[A-Za-z0-9_-]{16,256}$/.test(secret)) {
  console.error("TELEGRAM_WEBHOOK_SECRET must be 16-256 characters of A-Z a-z 0-9 _ - (Telegram's rule).");
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json());

const result =
  arg === "--delete"
    ? await api("deleteWebhook", { drop_pending_updates: true })
    : await api("setWebhook", {
        url: `${arg.replace(/\/+$/, "")}/api/telegram/webhook`,
        secret_token: secret,
        allowed_updates: ["message"],
        drop_pending_updates: true,
      });

console.log(result);
process.exit(result.ok ? 0 : 1);
