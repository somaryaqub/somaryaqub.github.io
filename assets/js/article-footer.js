/**
 * article-footer.js
 * Drop these lines just before </body> in any article:
 *
 *   <script>
 *     const CURRENT_SLUG = "your-post-slug";
 *     const CURRENT_TAGS = ["tag-one", "tag-two"];
 *   </script>
 *   <script src="../assets/js/posts.js"></script>
 *   <script src="../assets/js/article-footer.js"></script>
 */

(function () {
  const allPosts = typeof POSTS !== "undefined" ? POSTS : [];

  // Related by tag first; fall back to 3 most recent if none found
  let related = allPosts
    .filter((p) => p.slug !== CURRENT_SLUG && p.tags.some((t) => CURRENT_TAGS.includes(t)))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  if (!related.length) {
    related = allPosts
      .filter((p) => p.slug !== CURRENT_SLUG)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }

  function formatDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-CA", {
      year: "numeric", month: "long", day: "numeric",
    });
  }

  const cardsHTML = related.map((p) => `
    <a class="af-card" href="${p.slug}.html">
      <div class="af-card-meta">${formatDate(p.date)}</div>
      <div class="af-card-title">${p.title}</div>
      <div class="af-card-excerpt">${p.excerpt || ""}</div>
      <div class="af-card-read">Read →</div>
    </a>`).join("");

  const tagLinks = CURRENT_TAGS.map((t) =>
    `<a class="af-tag" href="../index.html">All posts tagged "${t}"</a>`
  ).join("");

  const footer = document.createElement("footer");
  footer.className = "af-footer";
  footer.innerHTML = `
    <style>
      .af-footer {
        margin-top: 4rem;
        border-top: 2px solid #275D43;
        padding-top: 2.5rem;
        padding-bottom: 3rem;
        font-family: 'Alegreya Sans', system-ui, sans-serif;
        color: #2a2a2a;
        box-sizing: border-box;
      }
      .af-inner {
        max-width: 740px;
        margin: 0 auto;
        padding: 0 1.5rem;
        box-sizing: border-box;
      }
      .af-heading {
        font-size: .7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .1em;
        color: #275D43;
        margin-bottom: 1.1rem;
      }
      .af-cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .af-card {
        display: flex;
        flex-direction: column;
        gap: .35rem;
        padding: 1rem 1.1rem;
        border: 1px solid #dde5e0;
        border-radius: 8px;
        background: #fff;
        text-decoration: none;
        color: inherit;
        transition: border-color .15s, box-shadow .15s, transform .15s;
      }
      .af-card:hover {
        border-color: #275D43;
        box-shadow: 0 3px 12px rgba(39,93,67,.09);
        transform: translateY(-2px);
        text-decoration: none;
      }
      .af-card-meta { font-size: .72rem; color: #6b6b6b; font-weight: 500; }
      .af-card-title {
        font-family: 'Alegreya', Georgia, serif;
        font-size: 1rem;
        font-weight: 700;
        color: #2a2a2a;
        line-height: 1.3;
      }
      .af-card-excerpt { font-size: .8rem; color: #6b6b6b; line-height: 1.55; flex: 1; }
      .af-card-read { font-size: .78rem; font-weight: 600; color: #275D43; margin-top: .25rem; }
      .af-tags { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: 2rem; }
      .af-tag {
        font-size: .72rem;
        padding: .2rem .65rem;
        border-radius: 999px;
        border: 1.5px solid #275D43;
        color: #275D43;
        text-decoration: none;
        transition: background .15s, color .15s;
      }
      .af-tag:hover { background: #275D43; color: #fff; text-decoration: none; }
      .af-subscribe {
        background: #e8f0ec;
        border-radius: 8px;
        padding: 1.35rem 1.5rem 1.25rem;
        margin-bottom: 1.75rem;
      }
      .af-subscribe p { margin: 0 0 .85rem; color: #6b6b6b; font-size: .875rem; line-height: 1.5; }
      .af-form { display: flex; gap: .5rem; flex-wrap: wrap; }
      .af-form input[type="email"] {
        flex: 1;
        min-width: 200px;
        padding: .55rem .8rem;
        border-radius: 6px;
        border: 1.5px solid #c8d8ce;
        background: #fff;
        font-family: inherit;
        font-size: .875rem;
        outline: none;
        box-sizing: border-box;
      }
      .af-form input[type="email"]:focus { border-color: #275D43; }
      .af-form button {
        padding: .55rem 1.1rem;
        border-radius: 6px;
        border: none;
        background: #275D43;
        color: #fff;
        font-family: inherit;
        font-size: .875rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: background .15s;
      }
      .af-form button:hover { background: #1a3f2e; }
      .af-note { font-size: .72rem; color: #6b6b6b; margin-top: .5rem; }
      .af-home { display: inline-block; font-size: .85rem; font-weight: 500; color: #275D43; text-decoration: none; }
      .af-home:hover { text-decoration: underline; }
      @media (max-width: 640px) { .af-cards { grid-template-columns: 1fr; } }
      @media (max-width: 400px) { .af-inner { padding: 0 1rem; } }
    </style>

    <div class="af-inner">

      ${related.length ? `
        <div class="af-heading">Related reading</div>
        <div class="af-cards">${cardsHTML}</div>
        <div class="af-tags">${tagLinks}</div>
      ` : `<div class="af-tags">${tagLinks}</div>`}

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

      <a class="af-home" href="../index.html">← All posts</a>

    </div>
  `;

  document.body.appendChild(footer);
})();
