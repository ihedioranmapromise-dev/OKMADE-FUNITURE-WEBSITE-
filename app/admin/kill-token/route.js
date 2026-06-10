import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const authHeader = request.headers.get('x-admin-key');
  if (authHeader !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { tokenId } = await request.json();
    if (!tokenId) {
      return new Response(JSON.stringify({ error: 'Missing tokenId' }), { status: 400 });
    }

    const { error } = await supabase
      .from('tokens')
      .update({ status: 'killed' })
      .eq('id', tokenId);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
