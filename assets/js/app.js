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
            <h2 class="post-title"><a href="posts/${p.slug}.html">${p.title}</a></h2>
            <p class="post-excerpt">${p.excerpt}</p>
            <div class="post-footer">
              <div class="post-tags">${tagBadges}</div>
              <a class="read-more" href="posts/${p.slug}.html">Read →</a>
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
      <section class="home-hero">
        <h1 class="site-tagline">Writing on systems, community, & trying to make things work.</h1>
      </section>

      <div class="controls">
        <div class="tag-filters">
          <span class="filter-label">Filter by tag:</span>
          <button class="tag-pill ${!activeTag ? "active" : ""}" data-tag="">All</button>
          ${tagHTML}
        </div>
        <div class="sort-controls">
          <label class="filter-label" for="sort-select">Sort:</label>
          <select id="sort-select">
            <option value="desc" ${sortOrder === "desc" ? "selected" : ""}>Newest first</option>
            <option value="asc" ${sortOrder === "asc" ? "selected" : ""}>Oldest first</option>
          </select>
        </div>
      </div>

      <div class="posts-grid">
        ${noPostsMsg}
        ${postsHTML}
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
          <div class="post-nav">
            <a class="back-link" href="#/">← All posts</a>
          </div>
        </div>
      `;

      document.querySelectorAll(".post-tag.clickable").forEach((badge) => {
        badge.addEventListener("click", () => {
          activeTag = badge.dataset.tag;
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
