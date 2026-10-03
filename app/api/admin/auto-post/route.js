import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/send-email";
import { okmadeAnnouncementEmail } from "@/lib/email-templates";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const adminKey = request.headers.get("x-admin-key");
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { type, source_id, content, send_email } = await request.json();

    if (!type || !source_id || !content) {
      return new Response(
        JSON.stringify({ error: "Missing type, source_id, or content" }),
        { status: 400 }
      );
    }

    // Get OKMADE official client
    const { data: okmade } = await admin
      .from("clients")
      .select("id, username, display_name")
      .eq("is_okmade", true)
      .maybeSingle();

    if (!okmade) {
      return new Response(
        JSON.stringify({ error: "OKMADE profile not found" }),
        { status: 404 }
      );
    }

    // Prevent double-posting for the same source
    const { data: existing } = await admin
      .from("posts")
      .select("id")
      .eq("auto_source", type)
      .eq("auto_source_id", source_id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: false, error: "Already posted for this source.", post_id: existing.id }),
        { status: 200 }
      );
    }

    let imageUrls = [];
    let targetUrl = "";

    // ------ PROJECT ------
    if (type === "project") {
      const { data: project } = await admin
        .from("projects")
        .select("id, token_string, work_description, city")
        .eq("id", source_id)
        .maybeSingle();
      if (!project) {
        return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
      }

      const { data: progImgs } = await admin
        .from("progress_images")
        .select("image_url")
        .eq("project_id", source_id)
        .order("uploaded_at", { ascending: true })
        .limit(6);

      let imgs = progImgs;
      if (!imgs || imgs.length === 0) {
        const { data: reqImgs } = await admin
          .from("project_request_images")
          .select("image_url")
          .eq("project_id", source_id)
          .order("display_order", { ascending: true })
          .limit(6);
        imgs = reqImgs;
      }

      imageUrls = (imgs || []).map((i) => i.image_url).filter(Boolean);
      targetUrl = `/workspace/${project.token_string || project.id}`;
    }

    // ------ PRODUCT ------
    if (type === "product") {
      const { data: product } = await admin
        .from("showroom")
        .select("id")
        .eq("id", source_id)
        .maybeSingle();
      if (!product) {
        return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 });
      }

      const { data: imgs } = await admin
        .from("product_images")
        .select("image_url")
        .eq("product_id", source_id)
        .order("display_order", { ascending: true })
        .limit(6);
      imageUrls = (imgs || []).map((i) => i.image_url).filter(Boolean);
      targetUrl = `/product/${product.id}`;
    }

    // ------ CATALOG ------
    if (type === "catalog") {
      const { data: catalog } = await admin
        .from("catalogs")
        .select("id")
        .eq("id", source_id)
        .maybeSingle();
      if (!catalog) {
        return new Response(JSON.stringify({ error: "Catalog not found" }), { status: 404 });
      }

      const { data: imgs } = await admin
        .from("catalog_images")
        .select("image_url")
        .eq("catalog_id", source_id)
        .order("display_order", { ascending: true })
        .limit(6);
      imageUrls = (imgs || []).map((i) => i.image_url).filter(Boolean);
      targetUrl = `/catalog`;
    }

    // Insert the post
    const { data: post, error: postErr } = await admin
      .from("posts")
      .insert({
        author_id: okmade.id,
        content,
        image_urls: imageUrls,
        is_auto: true,
        auto_source: type,
        auto_source_id: source_id,
      })
      .select()
      .single();

    if (postErr) {
      return new Response(JSON.stringify({ error: postErr.message }), { status: 500 });
    }

    // Broadcast email if requested
    let emailsResult = { sent: 0, skipped: 0, failed: 0, total: 0 };

    if (send_email) {
      const { data: followers } = await admin
        .from("follows")
        .select("follower_id, clients:follower_id (id, email, display_name, username)")
        .eq("following_id", okmade.id);

      if (followers && followers.length > 0) {
        const tpl = okmadeAnnouncementEmail({
          title: "New on OKMADE",
          body: content,
          ctaUrl: `${process.env.NEXT_PUBLIC_BASE_URL}${targetUrl}`,
        });

        let sent = 0, skipped = 0, failed = 0;

        for (const f of followers) {
          const user = f.clients;
          if (!user?.email) { skipped++; continue; }

          const { data: settings } = await admin
            .from("user_settings")
            .select("email_notifications")
            .eq("user_id", user.id)
            .single();

          const wantsEmail = settings?.email_notifications ?? true;
          if (!wantsEmail) { skipped++; continue; }

          const result = await sendEmail({
            to: user.email,
            subject: tpl.subject,
            html: tpl.html,
          });
          if (result.error) failed++;
          else sent++;
        }

        emailsResult = { sent, skipped, failed, total: followers.length };
      }
    }

    // Mark source as broadcast_sent
    if (type === "project") {
      await admin.from("projects").update({ broadcast_sent: true }).eq("id", source_id);
    } else if (type === "product") {
      await admin.from("showroom").update({ broadcast_sent: true }).eq("id", source_id);
    } else if (type === "catalog") {
      await admin.from("catalogs").update({ broadcast_sent: true }).eq("id", source_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        post_id: post.id,
        target_url: targetUrl,
        image_count: imageUrls.length,
        emails: emailsResult,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
