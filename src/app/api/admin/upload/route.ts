import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceSupabase } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const BUCKET = "claim-covers";
const MAX_BYTES = 3 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Admin: upload a claim cover image to the public `claim-covers` bucket; returns its URL. */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server is not configured." }, { status: 503 });
  }
  if (!rateLimit(`admin-upload:${admin.userId}`, 20, 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file." }, { status: 400 });
  const ext = EXT[file.type];
  if (!ext) return NextResponse.json({ error: "Use a JPEG, PNG or WebP image." }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is larger than 3 MB." }, { status: 413 });

  const supabase = createServiceSupabase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, cacheControl: "31536000" });
  if (error) {
    const code = /not found/i.test(error.message) ? "migration_missing" : undefined;
    return NextResponse.json({ error: "Upload failed.", code }, { status: 500 });
  }
  return NextResponse.json({ url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }, { status: 201 });
}
