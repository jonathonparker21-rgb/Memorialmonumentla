# Memorial Monuments of Louisiana — Production Build

Version: v1.2.6

## What this version includes
- Production-ready Cloudflare Pages build
- Responsive admin layout that looks better on laptop screens
- Restoration gallery with real upload flow ready for Cloudflare R2
- Content save API ready for Cloudflare KV
- Delete support for uploaded gallery images

## Cloudflare setup required

### 1. Add KV binding
Create a KV namespace and bind it as:
- `SITE_CONTENT`

### 2. Add R2 binding
Create an R2 bucket and bind it as:
- `RESTORATION_IMAGES`

### 3. Add environment variables
Set these in Cloudflare Pages:
- `OWNER_USERNAME`
- `OWNER_PASSWORD`

Optional:
- `R2_PUBLIC_BASE_URL`
  - Use this if your R2 bucket has a public/custom domain
  - Example: `https://cdn.yourdomain.com`

## Admin login
Default starter login:
- Username: `admin`
- Password: `ChangeMe123!`

Set your own values in Cloudflare Pages environment variables before going live.

## Upload flow
In admin:
1. Add a title and description
2. Choose a photo file
3. Click Upload Photo
4. Click Save Changes

## Notes
- If API bindings are not configured yet, the admin can still save locally for preview
- Production publishing requires the Cloudflare bindings above

## New in v1.2.6
- Drag-and-drop restoration photo uploads in admin
- Click-to-choose upload fallback
- New uploads appear first in the gallery


## Upload troubleshooting checklist
If upload fails:
1. Confirm Pages binding exists: `RESTORATION_IMAGES` as an R2 bucket.
2. Confirm KV binding exists: `SITE_CONTENT`.
3. Confirm variables exist: `OWNER_USERNAME` and `OWNER_PASSWORD`.
4. Redeploy after adding or changing bindings.
5. Visit `/api/get-content` on the live site. It should return JSON, not a 404.
6. In admin, the upload area should say “Drag & drop a photo here”. If it still shows a URL field, the old build is deployed.


## Force refresh build
- Version: v1.2.6
- Build timestamp: 2026-04-29 13:10:31
- Purpose: force GitHub/Cloudflare to detect latest files.


## Admin upload troubleshooting
Version: v1.2.6

1. Visit `/api/diagnostics` on the live site.
2. It should show:
   - `SITE_CONTENT: true`
   - `RESTORATION_IMAGES: true`
   - `OWNER_USERNAME: true`
   - `OWNER_PASSWORD: true`
3. If any are false, add the binding or variable in Cloudflare and redeploy.
4. In admin, the gallery should show a drag-and-drop upload box, not a URL field.


## HEIC upload fix
Version: v1.2.6

The admin upload form now accepts `.heic` and `.heif` photos and converts them to JPEG before upload. This is needed because HEIC files often upload successfully but do not display in web browsers.


## Image display fix
Version: v1.2.6

Uploaded R2 image URLs now use `/api/image/restoration/...` instead of encoded slash paths. Existing encoded URLs are normalized in the browser. If an old uploaded image still does not display, remove it and re-upload it after deploying this version.
