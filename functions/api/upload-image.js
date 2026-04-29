function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function unauthorized() {
  return json({ error: "Unauthorized. Check OWNER_USERNAME and OWNER_PASSWORD." }, 401);
}

async function checkAuth(request, env) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Basic ")) return false;
  const raw = atob(auth.slice(6));
  const splitAt = raw.indexOf(":");
  if (splitAt === -1) return false;
  const username = raw.slice(0, splitAt);
  const password = raw.slice(splitAt + 1);

  const expectedUser = env.OWNER_USERNAME || "admin";
  const expectedPass = env.OWNER_PASSWORD || "ChangeMe123!";
  return username === expectedUser && password === expectedPass;
}

function sanitizeFilename(name = "upload") {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").toLowerCase();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESTORATION_IMAGES) {
    return json({ error: "Missing R2 binding RESTORATION_IMAGES." }, 500);
  }

  if (!(await checkAuth(request, env))) return unauthorized();

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return json({ error: "No file uploaded." }, 400);
    }

    const key = `restoration/${Date.now()}-${sanitizeFilename(file.name || "photo.jpg")}`;

    await env.RESTORATION_IMAGES.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" }
    });

    const publicBase = env.R2_PUBLIC_BASE_URL || "";
    const url = publicBase
      ? `${publicBase.replace(/\/$/, "")}/${key}`
      : `/api/image/${encodeURIComponent(key)}`;

    return json({ ok: true, key, url });
  } catch (error) {
    return json({ error: error.message || "Failed to upload image." }, 500);
  }
}
