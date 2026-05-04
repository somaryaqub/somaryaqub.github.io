// ─────────────────────────────────────────────
//  BLOG ENGINE
// ─────────────────────────────────────────────

const App = (() => {
  let activeTag = null;
  let sortOrder = "desc"; // "desc" = newest first

  // ── Helpers ──────────────────────────────────

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function slugify(tag) {
    return tag.toLowerCase().replace(/\s+/g, "-");
  }

  function getAllTags() {
    const set = new Set();
    POSTS.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }

  function filteredAndSorted() {
    let list = activeTag
      ? POSTS.filter((p) => p.tags.includes(activeTag))
      : [...POSTS];
    list.sort((a, b) =>
      sortOrder === "desc"
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );
    return list;
  }

  // ── Routing ───────────────────────────────────

  function getRoute() {
    const hash = window.location.hash.slice(1); // remove #
    if (!hash || hash === "/") return { type: "home" };
    if (hash.startsWith("/post/")) return { type: "post", slug: hash.slice(6) };
    return { type: "home" };
  }

  function navigate(path) {
    window.location.hash = path;
  }

  // ── Render: Home ──────────────────────────────

  function renderHome() {
    const tags = getAllTags();
    const posts = filteredAndSorted();

    const tagHTML = tags
      .map(
        (t) =>
          `<button class="tag-pill ${activeTag === t ? "active" : ""}" data-tag="${t}">${t}</button>`
      )
      .join("");

    const postsHTML = posts
      .map((p) => {
        const tagBadges = p.tags
          .map((t) => `<span class="post-tag" data-tag="${t}">${t}</span>`)
          .join("");
        return `
        <article class="post-card ${p.featured ? "featured" : ""}" data-slug="${p.slug}">
          <div class="post-card-inner">
            <div class="post-meta">
              <time>${formatDate(p.date)}</time>
              ${p.featured ? '<span class="featured-badge">Featured</span>' : ""}
            </div>
            <h2 class="post-title"><a href="#/post/${p.slug}">${p.title}</a></h2>
            <p class="post-excerpt">${p.excerpt}</p>
            <div class="post-footer">
              <div class="post-tags">${tagBadges}</div>
            <a class="read-more" href="#/post/${p.slug}">Read →</a>


            </div>
          </div>
        </article>`;
      })
      .join("");

    const noPostsMsg =
      posts.length === 0
        ? `<p class="no-posts">No posts with tag "<strong>${activeTag}</strong>". <button id="clear-tag">Clear filter</button></p>`
        : "";

    document.getElementById("main").innerHTML = `
      <div class="home-layout">

        <div class="home-main">
          <div class="controls">
            <div class="sort-controls">
              <label class="filter-label" for="sort-select">Sort:</label>
              <select id="sort-select">
                <option value="desc" ${sortOrder === "desc" ? "selected" : ""}>Newest first</option>
                <option value="asc" ${sortOrder === "asc" ? "selected" : ""}>Oldest first</option>
              </select>
            </div>
            ${activeTag ? `<div class="active-filter">Showing: <strong>${activeTag}</strong> <button id="clear-tag">✕ clear</button></div>` : ""}
          </div>

          <div class="posts-grid">
            ${noPostsMsg}
            ${postsHTML}
          </div>
        </div>

        <aside class="home-sidebar">
          <div class="sidebar-dict">
            <div class="dict-headword">
              <span class="dict-term">servanting</span>
              <span class="dict-pos">v., pres. part.</span>
            </div>
            <div class="dict-body">
              <p class="dict-def">The active, ongoing pursuit of refining service. <em>Servanting</em> is not a posture assumed for effect, but a discipline practiced in the texture of daily decisions: in how one listens, who one makes space for, and what one is willing to set aside.</p>
              <p class="dict-def">Distinct from <em>serving</em> (which describes a task) or <em>servant leadership</em> (which describes a philosophy), <em>servanting</em> names the lived act itself — the continuous, intentional choosing of others' flourishing as the animating logic of leadership. It is, at its root, a form of worship: the belief that how we treat those in our care is itself an act of accountability to something greater than ourselves.</p>
            </div>
          </div>

          <div class="sidebar-tags">
            <div class="sidebar-heading">Browse by tag</div>
            <div class="sidebar-tag-list">
              <button class="tag-pill ${!activeTag ? "active" : ""}" data-tag="">All</button>
              ${tagHTML}
            </div>
          </div>
        </aside>

      </div>
    `;

    // Events
    document.querySelectorAll(".tag-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTag = btn.dataset.tag || null;
        renderHome();
      });
    });

    document.querySelectorAll(".post-tag").forEach((badge) => {
      badge.addEventListener("click", (e) => {
        e.preventDefault();
        activeTag = badge.dataset.tag;
        renderHome();
        window.scrollTo(0, 0);
      });
    });

    document.getElementById("sort-select")?.addEventListener("change", (e) => {
      sortOrder = e.target.value;
      renderHome();
    });

    document.getElementById("clear-tag")?.addEventListener("click", () => {
      activeTag = null;
      renderHome();
    });
  }

  // ── Article Footer: Related Posts + Subscribe ──

  function buildArticleFooter(meta) {
    // Gather related posts: share at least one tag, exclude current, newest first, max 3
    const related = POSTS
      .filter((p) => p.slug !== meta.slug && p.tags.some((t) => meta.tags.includes(t)))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    // Group related by which shared tag surfaces them (use first matching tag)
    const relatedHTML = related.length
      ? related.map((p) => {
          const sharedTags = p.tags.filter((t) => meta.tags.includes(t));
          const tagBadges = sharedTags
            .map((t) => `<span class="post-tag">${t}</span>`)
            .join("");
          return `
            <a class="related-card" href="#/post/${p.slug}">
              <div class="related-card-tags">${tagBadges}</div>
              <div class="related-card-title">${p.title}</div>
              <div class="related-card-date">${formatDate(p.date)}</div>
            </a>`;
        }).join("")
      : `<p class="related-empty">No related posts yet.</p>`;

    // Tag links for "More on…" section
    const tagLinks = meta.tags
      .map((t) => `<button class="tag-pill" data-tag="${t}">All posts tagged "${t}"</button>`)
      .join("");

    return `
      <aside class="article-footer">

        <section class="article-footer-related">
          <h3 class="article-footer-heading">Related reading</h3>
          <div class="related-grid">
            ${relatedHTML}
          </div>
          <div class="related-tag-links">
            ${tagLinks}
          </div>
        </section>

        <section class="article-footer-subscribe">
          <div class="subscribe-block">
            <div class="subscribe-block-text">
              <h3 class="article-footer-heading">Stay in the loop</h3>
              <p>New posts on systems, community, and what actually works — direct to your inbox. No noise.</p>
            </div>
            <div class="subscribe-block-form">
              <!--
                MAILERLITE: replace the <form> below with your
                <div class="ml-embedded" data-form="XXXXXXXX"></div>
                snippet from MailerLite → Forms → Embedded
              -->
              <form
                class="subscribe-form"
                action="MAILERLITE_FORM_ACTION"
                method="post"
                target="_blank"
              >
                <input
                  type="email"
                  name="fields[email]"
                  placeholder="your@email.com"
                  required
                  autocomplete="email"
                />
                <button type="submit">Subscribe</button>
              </form>
              <p class="subscribe-note">No spam. Unsubscribe any time.</p>
            </div>
          </div>
        </section>

      </aside>`;
  }

  // ── Render: Single Post ───────────────────────

  async function renderPost(slug) {
    const meta = POSTS.find((p) => p.slug === slug);
    if (!meta) {
      document.getElementById("main").innerHTML = `
        <div class="not-found">
          <p>Post not found.</p>
          <a href="#/">← Back to all posts</a>
        </div>`;
      return;
    }

    document.getElementById("main").innerHTML = `<div class="post-loading">Loading…</div>`;

    try {
      const res = await fetch(`posts/${slug}.html`);
      if (!res.ok) throw new Error("fetch failed");
      const html = await res.text();

      const tagBadges = meta.tags
        .map((t) => `<span class="post-tag clickable" data-tag="${t}">${t}</span>`)
        .join("");

      document.getElementById("main").innerHTML = `
        <div class="post-page">
          <a class="back-link" href="#/">← All posts</a>
          <article class="post-full">
            <header class="post-header">
              <div class="post-meta">
                <time>${formatDate(meta.date)}</time>
              </div>
              <h1>${meta.title}</h1>
              <div class="post-tags">${tagBadges}</div>
            </header>
            <div class="post-body">
              ${html}
            </div>
          </article>
          ${buildArticleFooter(meta)}
          <div class="post-nav">
            <a class="back-link" href="#/">← All posts</a>
          </div>
        </div>
      `;

      // Tag badges in header → filter home
      document.querySelectorAll(".post-tag.clickable").forEach((badge) => {
        badge.addEventListener("click", () => {
          activeTag = badge.dataset.tag;
          navigate("/");
        });
      });

      // "All posts tagged X" buttons in article footer
      document.querySelectorAll(".article-footer .tag-pill").forEach((btn) => {
        btn.addEventListener("click", () => {
          activeTag = btn.dataset.tag;
          navigate("/");
        });
      });

      window.scrollTo(0, 0);
    } catch {
      document.getElementById("main").innerHTML = `
        <div class="not-found">
          <p>Couldn't load this post.</p>
          <a href="#/">← Back to all posts</a>
        </div>`;
    }
  }

  // ── Router ────────────────────────────────────

  function route() {
    const r = getRoute();
    if (r.type === "post") renderPost(r.slug);
    else renderHome();
  }

  // ── Init ──────────────────────────────────────

  function init() {
    window.addEventListener("hashchange", route);
    route();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
