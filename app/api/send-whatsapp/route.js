export async function POST(request) {
  const { phone, message } = await request.json();

  if (!phone || !message) {
    return new Response(JSON.stringify({ error: 'Phone and message are required' }), { status: 400 });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const apiKey = process.env.CALLMEBOT_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'CallMeBot API key not configured' }), { status: 500 });
  }

  const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const text = await response.text();
    if (response.ok) {
      return new Response(JSON.stringify({ success: true, result: text }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: 'CallMeBot error', details: text }), { status: 500 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to send WhatsApp message' }), { status: 500 });
  }
}
