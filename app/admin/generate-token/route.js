import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateTokenString() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(request) {
  const authHeader = request.headers.get('x-admin-key');
  if (authHeader !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const formData = await request.formData();
    const clientName = formData.get('clientName');
    const clientContact = formData.get('clientContact');
    const clientAddress = formData.get('clientAddress') || '';
    const workDescription = formData.get('workDescription') || '';
    const price = formData.get('price') ? parseFloat(formData.get('price')) : null;
    const doublePayment = formData.get('doublePayment') === 'true';
    const requestImages = formData.getAll('requestImages');

    if (!clientName || !clientContact || requestImages.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields or images' }), { status: 400 });
    }

    const tokenString = generateTokenString();
    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .insert([{
        token_string: tokenString,
        client_name: clientName,
        client_contact: clientContact,
        client_address: clientAddress,
        work_description: workDescription,
        price,
        double_payment: doublePayment,
        status: 'active',
      }])
      .select()
      .single();
    if (tokenError) throw tokenError;

    for (let i = 0; i < requestImages.length; i++) {
      const file = requestImages[i];
      const ext = file.name.split('.').pop();
      const fileName = `requests/${tokenString}_${Date.now()}_${i}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('workspace-requests')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('workspace-requests').getPublicUrl(fileName);
      await supabase.from('token_request_images').insert({
        token_id: token.id,
        image_url: urlData.publicUrl,
        display_order: i,
      });
    }

    return new Response(JSON.stringify({ success: true, token: tokenString }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
  }
