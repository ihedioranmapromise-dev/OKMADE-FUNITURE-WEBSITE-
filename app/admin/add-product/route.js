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
    const description = formData.get('description');
    const price = parseFloat(formData.get('price'));
    const sold = formData.get('sold') === 'true';
    const images = formData.getAll('images');

    if (!description || isNaN(price) || images.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing fields or no images' }), { status: 400 });
    }

    const { data: product, error: productError } = await supabase
      .from('showroom')
      .insert([{ description, price, sold }])
      .select()
      .single();
    if (productError) throw productError;

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const ext = file.name.split('.').pop();
      const fileName = `products/${product.id}_${Date.now()}_${i}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('showroom-bucket')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('showroom-bucket').getPublicUrl(fileName);
      await supabase.from('product_images').insert({
        product_id: product.id,
        image_url: urlData.publicUrl,
        display_order: i,
      });
    }

    return new Response(JSON.stringify({ success: true, productId: product.id }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
    }
