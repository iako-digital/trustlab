// Loads the illustrative demo claims from src/data/claims.ts into Supabase.
// Idempotent (upsert on seed_key). These claims are fictional demo content
// (tagged "demo"): do NOT run this against a production project.
//
// Usage:  npm run seed -- --yes
// Needs:  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
//         Node >= 22.18 (runs the .ts seed file via built-in type stripping).

import { createClient } from "@supabase/supabase-js";
import { SEED_CLAIMS } from "../src/data/claims.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (see .env.example).");
  process.exit(1);
}
if (!process.argv.includes("--yes")) {
  console.error(`This will upsert ${SEED_CLAIMS.length} demo claims into ${url}.\nRe-run with --yes to confirm.`);
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const rows = SEED_CLAIMS.map((c) => {
  const published = c.status !== "pending";
  return {
    seed_key: c.id,
    title: c.title,
    claim: c.claim,
    explanation: c.explanation,
    state: published ? "published" : "pending",
    verdict: published ? c.status : null,
    category: c.category,
    source_lang: c.sourceLang,
    submission_type: c.submissionType,
    source_url: c.sourceUrl ?? null,
    sources: c.sources,
    tags: c.tags ?? [],
    verified_label: c.verifiedBy ?? null,
    verified_at: c.verifiedAt ?? null,
    submitted_at: c.submittedAt,
  };
});

let { error } = await supabase.from("claims").upsert(rows, { onConflict: "seed_key" });
if (error?.code === "PGRST204" || error?.code === "42703") {
  // `tags` column missing: migration 0004 has not been applied. Seed without tags.
  console.warn("Column claims.tags not found (run migration 0004 for tags); seeding without tags.");
  ({ error } = await supabase
    .from("claims")
    .upsert(rows.map((r) => {
      const copy = { ...r };
      delete copy.tags;
      return copy;
    }), { onConflict: "seed_key" }));
}
if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}
console.log(`Seeded ${rows.length} claims.`);
