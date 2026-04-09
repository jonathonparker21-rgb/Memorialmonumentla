# Memorial Monuments of Louisiana — Draft Website

This is a preview-friendly draft package built from the information collected so far.

## Included pages
- Home: `index.html`
- About Us: `about.html`
- Contact Us: `contact.html`
- Owner Admin: `admin/index.html`

## Preview admin login
- Username: `admin`
- Password: `ChangeMe123!`

## What is filled in
- Business name
- Two locations
- Main phone and email
- Southern, locally owned homepage tone
- Main services:
  - new monuments and headstones
  - monument restoration
  - monument cleaning
  - releveling
  - repainting lettering
  - on-site engraving

## What still needs owner details later
- company history
- years in business
- service area details
- actual monument photos
- gallery and headstone size/product listings
- final domain name

## How this preview works
- Public pages load the starter content from `site-content.json`
- Owner changes in the admin area save to the browser for preview
- This makes it easy to review wording before building the final Cloudflare production version


## Version system
- Current version starts at `v1.0.0`
- Owners can change the version in the admin panel
- The version appears in the public site footer
- Each HTML file includes a `<!-- VERSION: ... -->` header comment to help force Git/Cloudflare updates
