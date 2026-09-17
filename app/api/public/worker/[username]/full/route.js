import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { username } = params;

    // 1. Get client (safe columns only)
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select(
        "id, username, display_name, first_name, last_name, bio, skill, profile_pic, work_address, calling_phone, age, whatsapp_url, facebook_url, tiktok_url, instagram_url"
      )
      .eq("username", username)
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: "Client not found." }), {
        status: 404,
      });
    }

    // 2. Killed projects for this client
    const { data: projects } = await supabase
      .from("projects")
      .select("id, token_string, work_description, created_at, city")
      .eq("client_id", client.id)
      .eq("status", "killed")
      .order("created_at", { ascending: false });

    // 3. Stories from last 24 hours
    const { data: posts } = await supabase
      .from("client_posts")
      .select("*")
      .eq("client_id", client.id)
      .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    // 4. Attach reactions/views/comments to each story
    const storiesWithInteractions = await Promise.all(
      (posts || []).map(async (post) => {
        const { count: viewCount } = await supabase
          .from("story_views")
          .select("*", { count: "exact", head: true })
          .eq("story_id", post.id);
        const { data: reactions } = await supabase
          .from("story_reactions")
          .select("reaction_type, user_id")
          .eq("story_id", post.id);
        const { data: comments } = await supabase
          .from("story_comments")
          .select("*")
          .eq("story_id", post.id)
          .order("created_at", { ascending: true });
        return {
          ...post,
          viewCount: viewCount || 0,
          reactions: reactions || [],
          comments: comments || [],
        };
      })
    );

    // Return only safe fields (no email, no password_hash, no phone_number)
    return new Response(
      JSON.stringify({
        client: {
          username: client.username,
          display_name: client.display_name,
          first_name: client.first_name,
          last_name: client.last_name,
          bio: client.bio,
          skill: client.skill,
          profile_pic: client.profile_pic,
          work_address: client.work_address,
          calling_phone: client.calling_phone,
          age: client.age,
          whatsapp_url: client.whatsapp_url,
          facebook_url: client.facebook_url,
          tiktok_url: client.tiktok_url,
          instagram_url: client.instagram_url,
        },
        projects: projects || [],
        stories: storiesWithInteractions,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
