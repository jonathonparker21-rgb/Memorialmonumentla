export async function onRequestGet(context) {
  const { env } = context;
  const result = {
    ok: true,
    SITE_CONTENT: Boolean(env.SITE_CONTENT),
    RESTORATION_IMAGES: Boolean(env.RESTORATION_IMAGES),
    OWNER_USERNAME: Boolean(env.OWNER_USERNAME),
    OWNER_PASSWORD: Boolean(env.OWNER_PASSWORD),
    R2_PUBLIC_BASE_URL: Boolean(env.R2_PUBLIC_BASE_URL)
  };

  return new Response(JSON.stringify(result, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
