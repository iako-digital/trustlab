# TrustLab browser extension (Manifest V3)

Shows a green / amber / red badge on Facebook and Telegram posts that match a
published TrustLab fact-check. Clicking the badge opens the full check.

- `background.js` – service worker; fetches `/api/claims` from the TrustLab site and caches it for 10 minutes.
- `content.js` + `matcher.js` – find posts, match their text against claims, append the badge.
- `popup.html/js/css` – on/off switch and the TrustLab site address.

## Install (unpacked)

1. Run `npm run pack:extension` (or use `public/trustlab-extension.zip`) and unzip it.
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked** and pick the folder.
3. Open the popup, enter the address of your TrustLab site and click **Save**.

Supported pages: `facebook.com`, `web.telegram.org`, `t.me/s/<channel>`.
Post selectors live at the top of `content.js`; Facebook and Telegram change their markup often, so expect to adjust them.

Matching is intentionally conservative (shared distinctive words with a claim), so a badge means "this post resembles a checked claim", not a verdict on the post itself.
