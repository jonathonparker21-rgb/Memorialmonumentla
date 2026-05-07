# Memorial Monuments of Louisiana — Production Build

Version: v1.4.3

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

## New in v1.4.3
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
- Version: v1.4.3
- Build timestamp: 2026-04-29 13:10:31
- Purpose: force GitHub/Cloudflare to detect latest files.


## Admin upload troubleshooting
Version: v1.4.3

1. Visit `/api/diagnostics` on the live site.
2. It should show:
   - `SITE_CONTENT: true`
   - `RESTORATION_IMAGES: true`
   - `OWNER_USERNAME: true`
   - `OWNER_PASSWORD: true`
3. If any are false, add the binding or variable in Cloudflare and redeploy.
4. In admin, the gallery should show a drag-and-drop upload box, not a URL field.


## HEIC upload fix
Version: v1.4.3

The admin upload form now accepts `.heic` and `.heif` photos and converts them to JPEG before upload. This is needed because HEIC files often upload successfully but do not display in web browsers.


## Image display fix
Version: v1.4.3

Uploaded R2 image URLs now use `/api/image/restoration/...` instead of encoded slash paths. Existing encoded URLs are normalized in the browser. If an old uploaded image still does not display, remove it and re-upload it after deploying this version.


## R2 image route fix
Version: v1.4.3

The image display route now uses `/api/image?key=...` instead of path-style routing. This avoids Cloudflare Pages route issues with slashes inside R2 object keys.


## Content version fix
Version: v1.4.3

The public site now loads production content from Cloudflare first, but it will not let older saved KV content such as v1.4.3 override this newer build. If the footer still shows an old version, clear the browser site data or delete/update the `site-content` key in the `SITE_CONTENT` KV namespace.


## Embedded gallery images
Version: v1.4.3

Restoration gallery photos are now compressed in the browser and saved directly into the site content as JPEG data. This avoids R2 image-display route problems. R2 can still exist, but it is no longer required for the restoration gallery to display photos.


## Cache-bust gallery fix
Version: v1.4.3

This build uses `main-v130.js` and `admin-v130.js` so the browser cannot keep loading old cached JavaScript. Old broken R2 image cards are hidden. Re-upload gallery photos after deploying this build.


## New in v1.4.3
- Optional before photo for restoration uploads.
- Before/after slider appears when a before photo is supplied.
- Upload button now also saves gallery changes.
- Services list is no longer limited to six items.


## Fixed in v1.4.3
- Fixed upload/save error caused by removed fixed service fields.
- Admin now safely ignores missing optional fields instead of crashing.


## New in v1.4.3
- Added Homepage Hero Photo manager in admin.
- Hero photo can be uploaded and saved.
- Current hero photo can be downloaded.
- Current hero photo can be removed.


## New in v1.4.3
- Testimonial management added to admin.
- Testimonials can be approved, denied, edited, or removed.
- Removed the extra bottom Save button.
- Added small Reset Colors to Default button in Design Controls.


## Fixed in v1.4.3
- Forced Homepage Hero Photo manager to appear in admin.
- Forced Testimonials manager to appear in admin.
- Current active testimonials now show in card layout similar to restoration photos.


## New in v1.4.3
- Removed draft/client-facing notes.
- Reworked About page copy to sound finished and customer-facing.
- Polished the Our Services card layout.
- Reworded service cards to sell the business services instead of sounding like website guidance.


## New in v1.4.3
- Restoration gallery now supports both professional before/after comparisons and polished single-photo cards.
- Before photo remains optional.
- Single finished photos now display with a more polished presentation.


## New in v1.4.3
- Sample testimonials are now visible in the admin testimonial manager too.
- Seeded testimonials were rewritten to sound more natural for North Louisiana while still staying professional.
