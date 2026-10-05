import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { setContent } from "@/lib/site-content";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { type, data_url } = await request.json();
    if (!type || !data_url) return badRequest("Missing fields");

    if (!["favicon", "logo"].includes(type)) {
      return badRequest("Unknown branding type");
    }

    // data_url format: data:image/png;base64,....
    const match = data_url.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (!match) return badRequest("Invalid image data");

    const mime = match[1];
    const base64 = match[2];
    const buffer = Buffer.from(base64, "base64");
    const ext = mime.split("/")[1] || "png";

    const path = `branding/${type}_${Date.now()}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("story-images")
      .upload(path, buffer, { contentType: mime, cacheControl: "31536000", upsert: true });
    if (upErr) return serverError(upErr.message);

    const { data: urlData } = admin.storage.from("story-images").getPublicUrl(path);

    await setContent(`branding_${type}_url`, urlData.publicUrl);
    await logActivity({
      action: "branding_updated",
      target_type: "branding",
      details: { type, url: urlData.publicUrl },
    });

    return new Response(
      JSON.stringify({ success: true, url: urlData.publicUrl }),
      { status: 200 }
    );
  } catch (err) {
    return serverError(err.message);
  }
}
