# Auth0 Universal Login — Villa TimTavio branding

Files here customise the Auth0-hosted login screen so it matches the dashboard
theme (`packages/theme`) instead of Auth0's default blue/white template.

| File | What it styles | Where to apply |
|------|----------------|----------------|
| `universal-login.liquid` | The **page chrome** around the login widget (split layout, background, fonts, wordmark) | Dashboard → Branding → Universal Login → Advanced → **Page Templates** |
| `branding-theme.json` | The **widget itself** (button/input colours, radius, fonts) | Management API `PATCH /api/v2/branding/themes/{id}`, or the no-code **Styles** editor |

The two are complementary: the template can't recolour Auth0's injected widget,
and the theme can't lay out the page. Apply **both** for a consistent result.

## Prerequisites
- **Custom domain** on the Auth0 tenant — Page Templates are gated behind a
  verified custom domain (Dashboard → Branding → Custom Domains). Without it,
  you can still apply `branding-theme.json` (colours/fonts/radius) via the
  no-code Styles editor; only the `.liquid` layout needs the custom domain.
- Upload the logo (`apps/owner-dashboard/public/images/dark-logo.svg` or a
  dedicated login logo) under Branding → Universal Login → **Logo**.

## Applying the page template (with custom domain)
1. Dashboard → Branding → Universal Login → Advanced Options → **Page Templates**.
2. Paste the contents of `universal-login.liquid`.
3. Keep the required `{%- auth0:head -%}` and `{%- auth0:widget -%}` tags.
4. Preview, then Save.

## Applying the widget theme via Management API
```bash
# 1. Get a Management API token (Dashboard → APIs → Auth0 Management API → Test)
# 2. Find the theme id (or create one if none exists):
curl -s https://YOUR_TENANT.us.auth0.com/api/v2/branding/themes/default \
  -H "Authorization: Bearer $MGMT_TOKEN"

# 3. Update it (strip the "comment" key first — it's documentation only):
curl -X PATCH https://YOUR_TENANT.us.auth0.com/api/v2/branding/themes/THEME_ID \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @branding-theme.json
```
> Remove the leading `"comment"` field from `branding-theme.json` before sending —
> the API rejects unknown keys.

## Also worth doing (in the Auth0 dashboard, no code)
- **Application Name** → set to `Villa TimTavio` so the widget header stops
  showing the raw tenant id (`dev-kymggqjr0v61cbxe`).
- Consider dropping `prompt: 'login'` in `src/lib/auth0.ts` if you don't want to
  force re-authentication on every visit.

## Palette reference (from `packages/theme/src/global.css`)
| Token | Hex |
|-------|-----|
| navy (primary) | `#0f1f2e` |
| navy-mid | `#1a3040` |
| background (cream) | `#f5f3f0` |
| surface | `#ffffff` |
| border | `#e3e0da` |
| muted text | `#797168` |
| crater-brown | `#8c7261` |
| brown-dark | `#5e4737` |
| maroon | `#5e3a31` |
| gold (accent) | `#c4a882` |

Fonts: **Cormorant Garamond** (display), **Inter** (body).
