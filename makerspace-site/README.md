# Layer by Layer: 3D printing builds site

A static website for sharing 3D printing builds. It has:

- **A build catalog** with search and filters by level and category.
- **A 3D viewer for each build.** People can spin it, explode the parts, play the motion, and drag a *print progress* slider to watch the model build up layer by layer.
- **Free plans**: printer settings, a parts checklist and step-by-step instructions. Progress is saved in the visitor's browser, and the plans can be printed or saved as a PDF.
- **Paid print files** sold through [Stripe Payment Links](https://stripe.com/payments/payment-links), with one link per build plus an optional bundle.
- **The printing lab**: six interactive lessons (layer height, infill, overhangs, materials, print cost, and a quiz).

There's no build step and no server. It's plain HTML, CSS and JavaScript.

## Run it locally

```bash
cd makerspace-site
python3 -m http.server 8000
# open http://localhost:8000
```

## Add your builds

All content lives in **`js/builds.js`**. The five builds there now are **examples** (they show an "Example" badge). Replace them with your real builds.

| Field | What it does |
|---|---|
| `id` | URL slug, e.g. `flapping-owl` → `#/build/flapping-owl` |
| `example` | `true` shows the Example badge. Delete it for real builds. |
| `name`, `tagline`, `description` | Text shown on cards and the build page |
| `category`, `difficulty` | Used by the filters. Difficulty is `Beginner`, `Intermediate` or `Advanced`. |
| `model` | `{ stl: "models/my-part.stl", color: "sky" }` loads your real STL into the 3D viewer. `{ type: "owl" }` etc. uses a built-in stand-in model. |
| `price` | Price of the print files, in `SITE.currency` |
| `stripeLink` | The Stripe Payment Link URL for this build. Empty = "Checkout isn't connected yet". |
| `plansPdf` | Optional free PDF in `plans/`. Without one, visitors can use "Print or save as PDF". |
| `stats` | `printHours`, `filamentGrams`, `parts`, `material` |
| `learn` | Skills the build teaches |
| `settings` | Printer settings table (any keys you like) |
| `bom` | Parts list: `{ qty, item }` |
| `steps` | Instructions: `{ title, text }` |
| `tips` | One tip shown under the steps |

The STL for the **3D preview** in `models/` is public, so anyone can download it. Use a low-detail preview or a merged/decimated version, **not** the file you sell.

## Set up selling with Stripe Payment Links

1. Create a free [Stripe](https://dashboard.stripe.com/register) account.
2. Upload each build's paid files (a zip of the STLs and 3MF) to private storage that gives a hard-to-guess link. Google Drive "anyone with the link", Dropbox, or Cloudflare R2 all work.
3. In Stripe, go to **Payment Links → New**. Add a product (for example "The Flapping Owl print files", $4).
4. Under **After payment**, choose **Don't show confirmation page → Show a custom message** (the wording in Stripe may vary slightly), and paste: *"Thanks! Download your files here: <your link>"*. Stripe also emails a receipt.
5. Copy the payment link (`https://buy.stripe.com/...`) into that build's `stripeLink` in `js/builds.js`.
6. Optional: make one more link for the bundle and put it in `SITE.bundle.stripeLink`.

**Never put the paid files in this repo or the `models/` folder.** Everything in this site is public. `.gitignore` already ignores a `private-files/` folder in case you keep them nearby.

This setup is simple and cheap, but a buyer could share their download link. If that becomes a problem, upgrade to Stripe Checkout with a small serverless function that issues expiring download links.

## Publish it

Any static host works:

- **Netlify or Cloudflare Pages:** drag the `makerspace-site` folder onto the dashboard, or connect the repo and set the publish directory to `makerspace-site`.
- **GitHub Pages:** move the folder to its own repo (or `/docs`) and turn on Pages.

Then update `SITE.contactEmail` in `js/builds.js` and the license wording in the FAQ in `index.html`.

## Files

```
makerspace-site/
├── index.html        all pages (home, builds, build detail, learn, FAQ)
├── css/styles.css    styles, light and dark mode, print layout for plans
├── js/builds.js      ← your content: shop settings and builds
├── js/viewer.js      3D viewer and stand-in models (three.js r128)
├── js/learn.js       interactive lessons
├── js/app.js         routing, catalog, build pages, checkout buttons
├── models/           public preview STLs
└── plans/            optional free plan PDFs
```
