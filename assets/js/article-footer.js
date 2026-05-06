/**
 * article-footer.js
 * Paste these lines just before </body> in any article:
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
      year: "numeric", month: "short", day: "numeric",
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
    `<a class="af-tag" href="https://somaryaqub.github.io/index.html">All posts tagged "${t}"</a>`
  ).join("");

  const footer = document.createElement("footer");
  footer.className = "af-footer";
  footer.innerHTML = `
    <style>
      .af-footer {
        margin-top: 4rem;
        background: #275D43;
        padding: 2rem 0 0;
        font-family: 'Alegreya Sans', system-ui, sans-serif;
        color: rgba(255,255,255,0.85);
        box-sizing: border-box;
      }
      .af-inner {
        max-width: 740px;
        margin: 0 auto;
        padding: 0 1.5rem;
        box-sizing: border-box;
      }
      .af-heading {
        font-size: .65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .12em;
        color: rgba(255,255,255,0.5);
        margin-bottom: .75rem;
      }

      /* ── Nav + tags row ── */
      .af-nav-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: .5rem;
        margin-bottom: 1.25rem;
      }
      .af-home {
        font-size: .78rem;
        font-weight: 600;
        color: #fff;
        text-decoration: none;
        white-space: nowrap;
        padding: .2rem .65rem;
        border-radius: 999px;
        border: 1.5px solid rgba(255,255,255,0.5);
        transition: border-color .15s, background .15s;
      }
      .af-home:hover { border-color: #fff; background: rgba(255,255,255,0.1); text-decoration: none; }
      .af-sep {
        width: 1px; height: 1rem;
        background: rgba(255,255,255,0.25);
        flex-shrink: 0;
      }
      .af-tag {
        font-size: .7rem;
        padding: .15rem .55rem;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.3);
        color: rgba(255,255,255,0.75);
        text-decoration: none;
        transition: border-color .15s, color .15s, background .15s;
      }
      .af-tag:hover { border-color: #fff; color: #fff; background: rgba(255,255,255,0.1); text-decoration: none; }

      /* ── Related cards ── */
      .af-cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: .75rem;
        margin-bottom: 1.5rem;
      }
      .af-card {
        display: flex;
        flex-direction: column;
        gap: .3rem;
        padding: .85rem 1rem;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 7px;
        background: rgba(255,255,255,0.07);
        text-decoration: none;
        color: inherit;
        transition: background .15s, border-color .15s;
      }
      .af-card:hover { background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.35); text-decoration: none; }
      .af-card-meta { font-size: .68rem; color: rgba(255,255,255,0.5); font-weight: 500; }
      .af-card-title {
        font-family: 'Alegreya', Georgia, serif;
        font-size: .95rem;
        font-weight: 700;
        color: #fff;
        line-height: 1.3;
      }
      .af-card-excerpt { font-size: .76rem; color: rgba(255,255,255,0.6); line-height: 1.5; flex: 1; }
      .af-card-read { font-size: .72rem; font-weight: 600; color: #E09964; margin-top: .2rem; }

      /* ── Bio ── */
      .af-bio {
        padding: 1.25rem 0 1.5rem;
        border-top: 1px solid rgba(255,255,255,0.15);
      }
      .af-bio-name {
        font-family: 'Alegreya', Georgia, serif;
        font-size: .95rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: .35rem;
      }
      .af-sc {
        font-variant: small-caps;
        font-feature-settings: "smcp";
        font-size: .88em;
        letter-spacing: .04em;
        color: rgba(255,255,255,0.55);
        font-weight: 400;
      }
      .af-bio-desc {
        font-size: .8rem;
        color: rgba(255,255,255,0.7);
        line-height: 1.6;
        margin-bottom: .3rem;
      }
      .af-bio-desc a { color: #E09964; text-decoration: none; font-weight: 600; }
      .af-bio-desc a:hover { text-decoration: underline; }
      .af-bio-disclaimer { font-size: .72rem; color: rgba(255,255,255,0.4); font-style: italic; }

      /* ── Colophon ── */
      .af-colophon {
        font-size: .68rem;
        color: rgba(255,255,255,0.3);
        text-align: center;
        padding: .75rem 1.5rem;
        border-top: 1px solid rgba(255,255,255,0.1);
        margin-top: 0;
      }
      .af-colophon a { color: rgba(255,255,255,0.4); text-decoration: underline; }
      .af-colophon a:hover { color: rgba(255,255,255,0.7); }

      @media (max-width: 580px) { .af-cards { grid-template-columns: 1fr; } }
      @media (max-width: 400px) { .af-inner { padding: 0 1rem; } }
    </style>

    <div class="af-inner">

      <div class="af-nav-row">
        <a class="af-home" href="https://somaryaqub.github.io/index.html">← All posts</a>
        <div class="af-sep"></div>
        ${tagLinks}
      </div>

      ${related.length ? `
        <div class="af-heading">Related reading</div>
        <div class="af-cards">${cardsHTML}</div>
      ` : ""}

      <div class="af-bio">
        <div class="af-bio-name">
          Omar Yaqub <span class="af-sc">icd.d &nbsp;dsl(hon) &nbsp;mba &nbsp;bsc</span>
        </div>
        <p class="af-bio-desc">
          Servant of Servants for <a href="https://islamicfamily.ca/" target="_blank">IslamicFamily</a>,
          founder of <a href="https://flourishing.systems/" target="_blank">Flourishing Systems</a>,
          a former Co-Historian Laureate for the City of Edmonton &amp; past MBA instructor at the University of Alberta.
          <a href="https://linkedin.com/in/somaryaqub" target="_blank">LinkedIn</a>.
        </p>
        <p class="af-bio-disclaimer">Opinions are my own &amp; do <em>not</em> speak for any organization.</p>
      </div>

    </div>

    <div class="af-colophon">
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC with Attribution</a>
      2026 ✸ Made with ❤️ on amiskwaciwâskahikan (Edmonton).
    </div>
  `;

  document.body.appendChild(footer);

  if (!window.ml) {
    (function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[])
    .push(arguments);},l=d.createElement(e),l.async=1,l.src=u,
    n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})
    (window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
    ml('account', '714092');
  }

  // Show popup after 1 minute on page
  setTimeout(function () {
    if (window.ml) ml('show', 'WfrvP4', { force: true });
  }, 60000);
})();