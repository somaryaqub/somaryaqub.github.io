/**
 * article-footer.js
 * Drop this script at the bottom of any article page.
 * It reads CURRENT_SLUG and CURRENT_TAGS from the page,
 * then self-renders a minimal footer with related posts + subscribe.
 *
 * Usage: paste near the closing </body> tag:
 *
 *   <script>
 *     const CURRENT_SLUG = "your-post-slug";
 *     const CURRENT_TAGS = ["tag-one", "tag-two"];
 *   </script>
 *   <script src="../assets/js/posts.js"></script>
 *   <script src="../assets/js/article-footer.js"></script>
 */

(function () {
  // ── Find related posts ────────────────────────
  const related = (typeof POSTS !== "undefined" ? POSTS : [])
    .filter(
      (p) =>
        p.slug !== CURRENT_SLUG &&
        p.tags.some((t) => CURRENT_TAGS.includes(t))
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  function formatDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // ── Build HTML ────────────────────────────────
  const relatedHTML = related.length
    ? related
        .map(
          (p) => `
        <a class="af-card" href="${p.slug}.html">
          <span class="af-card-title">${p.title}</span>
          <span class="af-card-date">${formatDate(p.date)}</span>
        </a>`
        )
        .join("")
    : "";

  const tagLinks = CURRENT_TAGS.map(
    (t) =>
      `<a class="af-tag" href="../index.html#tag:${encodeURIComponent(t)}">All posts tagged "${t}"</a>`
  ).join("");

  const footer = document.createElement("footer");
  footer.className = "af-footer";
  footer.innerHTML = `
    <style>
      .af-footer {
        margin-top: 4rem;
        padding-top: 2rem;
        border-top: 2px solid #275D43;
        font-family: 'Alegreya Sans', system-ui, sans-serif;
        font-size: .9rem;
        color: #2a2a2a;
      }
      .af-section { margin-bottom: 2rem; }
      .af-heading {
        font-size: .7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .1em;
        color: #275D43;
        margin-bottom: .85rem;
      }
      .af-cards { display: flex; flex-direction: column; gap: .6rem; }
      .af-card {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 1rem;
        padding: .65rem .85rem;
        border: 1px solid #dde5e0;
        border-radius: 7px;
        background: #fff;
        text-decoration: none;
        color: inherit;
        transition: border-color .15s;
      }
      .af-card:hover { border-color: #275D43; text-decoration: none; }
      .af-card-title { font-weight: 500; color: #2a2a2a; }
      .af-card-date { font-size: .75rem; color: #6b6b6b; white-space: nowrap; }
      .af-tags { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .75rem; }
      .af-tag {
        font-size: .75rem;
        padding: .2rem .6rem;
        border-radius: 999px;
        border: 1.5px solid #275D43;
        color: #275D43;
        text-decoration: none;
      }
      .af-tag:hover { background: #275D43; color: #fff; text-decoration: none; }
      .af-subscribe {
        background: #e8f0ec;
        border-radius: 8px;
        padding: 1.25rem 1.5rem;
      }
      .af-subscribe p { margin: 0 0 .85rem; color: #6b6b6b; font-size: .875rem; }
      .af-form { display: flex; gap: .5rem; flex-wrap: wrap; }
      .af-form input[type="email"] {
        flex: 1;
        min-width: 200px;
        padding: .55rem .8rem;
        border-radius: 6px;
        border: 1.5px solid #dde5e0;
        background: #fff;
        font-family: inherit;
        font-size: .875rem;
        outline: none;
      }
      .af-form input[type="email"]:focus { border-color: #275D43; }
      .af-form button {
        padding: .55rem 1rem;
        border-radius: 6px;
        border: none;
        background: #275D43;
        color: #fff;
        font-family: inherit;
        font-size: .875rem;
        font-weight: 600;
        cursor: pointer;
      }
      .af-form button:hover { background: #1a3f2e; }
      .af-note { font-size: .72rem; color: #6b6b6b; margin-top: .5rem; }
      .af-home { display: inline-block; margin-top: 1.5rem; font-size: .85rem; font-weight: 500; color: #275D43; }
      .af-home:hover { text-decoration: underline; }
      @media (max-width: 540px) {
        .af-card { flex-direction: column; gap: .2rem; }
        .af-card-date { font-size: .72rem; }
      }
    </style>

    ${related.length ? `
    <div class="af-section">
      <div class="af-heading">Related reading</div>
      <div class="af-cards">${relatedHTML}</div>
      <div class="af-tags">${tagLinks}</div>
    </div>` : `
    <div class="af-section">
      <div class="af-tags">${tagLinks}</div>
    </div>`}

    <div class="af-section">
      <div class="af-subscribe">
        <div class="af-heading">Stay in the loop</div>
        <p>New posts, occasional notes. No noise.</p>
        <!--
          MAILERLITE: replace the form below with your
          <div class="ml-embedded" data-form="XXXXXXXX"></div> snippet
        -->
        <form class="af-form" action="MAILERLITE_FORM_ACTION" method="post" target="_blank">
          <input type="email" name="fields[email]" placeholder="your@email.com" required autocomplete="email" />
          <button type="submit">Subscribe</button>
        </form>
        <p class="af-note">No spam. Unsubscribe any time.</p>
      </div>
    </div>

    <a class="af-home" href="../index.html">← All posts</a>
  `;

  document.body.appendChild(footer);
})();
