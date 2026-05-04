# Omar Yaqub — Personal Blog

Static blog on GitHub Pages. No build tools, no frameworks.

## Adding a new post

**Step 1** — Create `posts/your-slug.html` with just the body HTML (no `<html>`/`<head>` tags):

```html
<p>Your article content...</p>
<h2>A section heading</h2>
<p>More content.</p>
```

**Step 2** — Add an entry to `assets/js/posts.js`:

```js
{
  slug: "your-slug",         // matches filename in /posts/
  title: "Your Title",
  date: "2025-05-15",        // YYYY-MM-DD
  excerpt: "Short teaser shown on the homepage.",
  tags: ["tag-one", "tag-two"],
  featured: false,
},
```

Push to `main` → GitHub Actions deploys automatically.

---

## MailerLite setup

1. Create account at mailerlite.com
2. **Forms → Create form → Embedded**
3. Copy the Universal Script → paste into `<head>` of `index.html`
4. Copy the `<div class="ml-embedded">` form HTML → paste into `index.html` footer, replacing the `<form>` element

---

## GitHub Pages setup

1. Push repo to GitHub
2. **Settings → Pages → Source → GitHub Actions**
3. Live at `https://YOUR-USERNAME.github.io/YOUR-REPO/`

For a custom domain: add a `CNAME` file with your domain name.

---

## Structure

```
/
├── index.html              ← Site shell
├── assets/
│   ├── css/style.css       ← All styles
│   └── js/
│       ├── posts.js        ← EDIT THIS to add posts
│       └── app.js          ← Engine (don't edit)
├── posts/
│   └── *.html              ← Article content files
└── .github/workflows/
    └── deploy.yml          ← Auto-deploy
```
