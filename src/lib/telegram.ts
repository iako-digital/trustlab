import "server-only";
import type { Locale } from "@/lib/types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const html = { esc, link: (url: string, label: string) => `<a href="${esc(url)}">${esc(label)}</a>` };

/** Sends an HTML-formatted message without link previews. Returns false if Telegram rejected it. */
export async function sendTelegramMessage(chatId: number, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4000),
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error("[telegram] sendMessage failed:", res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (e) {
    console.error("[telegram] sendMessage error:", e);
    return false;
  }
}

type L = Record<Locale, string>;

export const BOT_TEXT = {
  start: {
    ka: "👋 მოგესალმებით! ეს არის <b>TrustLab</b>-ის ფაქტ-ჩეკინგის ბოტი.\n\nგამომიგზავნეთ საეჭვო განცხადება, ახალი ამბავი ან ჭორი და მე შევამოწმებ: ჯერ გადამოწმებულ განცხადებებს გადავხედავ, შემდეგ კი AI-ით ვეძებ წყაროებს ინტერნეტში.\n\n⚠️ AI-ის პასუხი ორიენტირია და არა რედაქტორის ვერდიქტი.",
    hy: "👋 Բարի գալուստ։ Սա <b>TrustLab</b>-ի փաստերի ստուգման բոտն է։\n\nՈւղարկեք կասկածելի հայտարարություն, լուր կամ լուր-խոսակցություն, և ես կստուգեմ․ նախ կնայեմ արդեն ստուգված պնդումները, հետո AI-ով կփնտրեմ աղբյուրներ համացանցում։\n\n⚠️ AI-ի պատասխանը ուղենիշ է, ոչ թե խմբագրի վճիռ։",
    en: "👋 Welcome to the <b>TrustLab</b> Fact-Checking Bot.\n\nSend me a suspicious claim, news item or rumour and I will check it: first against claims our editors already verified, then with an AI web search for sources.\n\n⚠️ AI answers are guidance, not an editorial verdict.",
  } as L,
  tooShort: {
    ka: "გამომიგზავნეთ ცოტა უფრო სრული განცხადება (მინიმუმ ერთი წინადადება).",
    hy: "Ուղարկեք ավելի ամբողջական հայտարարություն (առնվազն մեկ նախադասություն)։",
    en: "Please send a fuller claim (at least one sentence).",
  } as L,
  checking: {
    ka: "🔎 ვამოწმებ…",
    hy: "🔎 Ստուգում եմ…",
    en: "🔎 Checking…",
  } as L,
  rateLimited: {
    ka: "ძალიან ბევრი მოთხოვნაა. სცადეთ რამდენიმე წუთში.",
    hy: "Չափազանց շատ հարցումներ։ Փորձեք մի քանի րոպեից։",
    en: "Too many requests. Please try again in a few minutes.",
  } as L,
  unavailable: {
    ka: "ამჟამად შემოწმება ვერ მოხერხდა. სცადეთ მოგვიანებით.",
    hy: "Այս պահին ստուգումը հնարավոր չէ։ Փորձեք ավելի ուշ։",
    en: "I could not run the check right now. Please try again later.",
  } as L,
  matchHeader: {
    ka: "✅ ეს განცხადება უკვე გადამოწმებულია TrustLab-ის რედაქტორების მიერ",
    hy: "✅ Այս պնդումն արդեն ստուգվել է TrustLab-ի խմբագիրների կողմից",
    en: "✅ This claim was already checked by TrustLab editors",
  } as L,
  aiHeader: {
    ka: "🤖 AI-ის პირდაპირი შემოწმება",
    hy: "🤖 AI-ի ուղիղ ստուգում",
    en: "🤖 AI live fact-check",
  } as L,
  aiNote: {
    ka: "ეს AI-ის შედეგია ინტერნეტ-ძიების საფუძველზე და არა TrustLab-ის რედაქტორული ვერდიქტი.",
    hy: "Սա AI-ի արդյունք է համացանցային որոնման հիման վրա, ոչ թե TrustLab-ի խմբագրական վճիռ։",
    en: "This is an AI result from live web search, not a TrustLab editorial verdict.",
  } as L,
  sources: { ka: "წყაროები", hy: "Աղբյուրներ", en: "Sources" } as L,
  fullCheck: { ka: "სრული შემოწმება", hy: "Ամբողջական ստուգում", en: "Read the full check" } as L,
  verdictLabel: { ka: "ვერდიქტი", hy: "Վճիռ", en: "Verdict" } as L,
};

export const VERDICT_TEXT: Record<string, Record<Locale, string>> = {
  TRUE: { ka: "🟢 სიმართლე", hy: "🟢 Ճշմարիտ", en: "🟢 TRUE" },
  FAKE: { ka: "🔴 მცდარი", hy: "🔴 Կեղծ", en: "🔴 FAKE" },
  MANIPULATIVE: { ka: "🟠 მანიპულირებადი", hy: "🟠 Մանիպուլյատիվ", en: "🟠 MANIPULATIVE" },
  UNVERIFIED: { ka: "⚪ გადაუმოწმებელი", hy: "⚪ Չստուգված", en: "⚪ UNVERIFIED" },
};
