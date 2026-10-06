export async function GET() {
  const key = process.env.VAPID_PUBLIC || "";
  return new Response(JSON.stringify({ key }), {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
