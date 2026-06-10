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
    const formData = await request.formData();
    const tokenId = formData.get('tokenId');
    const progressImages = formData.getAll('progressImages');

    if (!tokenId || progressImages.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing tokenId or images' }), { status: 400 });
    }

    // Verify token exists and is active
    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .select('id')
      .eq('id', tokenId)
      .single();
    if (tokenError || !token) {
      return new Response(JSON.stringify({ error: 'Token not found' }), { status: 404 });
    }

    for (let i = 0; i < progressImages.length; i++) {
      const file = progressImages[i];
      const ext = file.name.split('.').pop();
      const fileName = `progress/${tokenId}_${Date.now()}_${i}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('workspace-progress')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('workspace-progress').getPublicUrl(fileName);
      await supabase.from('progress_images').insert({
        token_id: tokenId,
        image_url: urlData.publicUrl,
      });
    }

    return new Response(JSON.stringify({ success: true, count: progressImages.length }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
