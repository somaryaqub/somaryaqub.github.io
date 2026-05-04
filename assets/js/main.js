/* ============================================================
   BLOG MAIN.JS
   - Loads posts from posts.json
   - Renders post cards on index.html
   - Renders article content on post.html
   - Handles tag filtering and date sorting 
   ============================================================ */

const isPostPage = document.body.classList.contains('post-page');

// ── FORMAT DATE ──────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const month = d.toLocaleString('en-CA', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  return { day, month, year, full: `${month} ${day}, ${year}` };
}

// ── SLUG → LABEL ─────────────────────────────────────────────
function tagLabel(slug) {
  return slug.replace(/-/g, ' ');
}

// ── BUILD TAG CHIPS HTML ──────────────────────────────────────
function tagsHtml(tags) {
  return tags.map(t => `<span class="tag-chip">${tagLabel(t)}</span>`).join('');
}

// ── INDEX PAGE ───────────────────────────────────────────────
async function initIndex() {
  const postList   = document.getElementById('postList');
  const tagButtons = document.getElementById('tagButtons');
  const sortNewest = document.getElementById('sortNewest');
  const sortOldest = document.getElementById('sortOldest');

  let posts = [];
  let activeTag = 'all';
  let sortDir = 'desc'; // desc = newest first

  try {
    const res = await fetch('posts.json');
    posts = await res.json();
  } catch (e) {
    postList.innerHTML = '<p class="no-results">Could not load posts. Make sure posts.json exists.</p>';
    return;
  }

  // Collect all unique tags
  const allTags = [...new Set(posts.flatMap(p => p.tags))].sort();

  // Build tag filter buttons
  allTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'tag-btn';
    btn.dataset.tag = tag;
    btn.textContent = tagLabel(tag);
    btn.addEventListener('click', () => setTag(tag));
    tagButtons.appendChild(btn);
  });

  // Sort handlers
  sortNewest.addEventListener('click', () => {
    sortDir = 'desc';
    sortNewest.classList.add('active');
    sortOldest.classList.remove('active');
    render();
  });

  sortOldest.addEventListener('click', () => {
    sortDir = 'asc';
    sortOldest.classList.add('active');
    sortNewest.classList.remove('active');
    render();
  });

  function setTag(tag) {
    activeTag = tag;
    tagButtons.querySelectorAll('.tag-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tag === tag);
    });
    render();
  }

  function render() {
    let filtered = activeTag === 'all'
      ? [...posts]
      : posts.filter(p => p.tags.includes(activeTag));

    filtered.sort((a, b) => {
      const diff = new Date(a.date) - new Date(b.date);
      return sortDir === 'desc' ? -diff : diff;
    });

    if (filtered.length === 0) {
      postList.innerHTML = '<p class="no-results">No posts with that tag yet.</p>';
      return;
    }

    postList.innerHTML = filtered.map((post, i) => {
      const d = formatDate(post.date);
      return `
        <a class="post-card" href="post.html?id=${post.id}" style="animation-delay:${i * 0.04}s">
          <div class="post-card-date">
            <span class="day">${d.day}</span>
            <span class="month-year">${d.month} ${d.year}</span>
          </div>
          <div class="post-card-body">
            <div class="post-card-tags">${tagsHtml(post.tags)}</div>
            <h2 class="post-card-title">${post.title}</h2>
            ${post.subtitle ? `<p class="post-card-subtitle">${post.subtitle}</p>` : ''}
            <p class="post-card-excerpt">${post.excerpt}</p>
            <span class="post-card-read">Read →</span>
          </div>
        </a>
      `;
    }).join('');
  }

  render();
}

// ── POST PAGE ────────────────────────────────────────────────
async function initPost() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('postTitle').textContent = 'Post not found';
    return;
  }

  let posts = [];
  try {
    const res = await fetch('posts.json');
    posts = await res.json();
  } catch (e) {
    document.getElementById('postTitle').textContent = 'Could not load posts.';
    return;
  }

  const post = posts.find(p => p.id === id);
  if (!post) {
    document.getElementById('postTitle').textContent = 'Post not found.';
    return;
  }

  // Update page meta
  document.title = `${post.title} — Omar Yaqub`;

  // Inject header
  const d = formatDate(post.date);
  document.getElementById('postMetaTop').innerHTML = `
    ${tagsHtml(post.tags)}
    <span class="post-meta-date">${d.full}</span>
  `;
  document.getElementById('postTitle').textContent = post.title;
  if (post.subtitle) {
    document.getElementById('postSubtitle').textContent = post.subtitle;
  }

  // Load article HTML file
  try {
    const articleRes = await fetch(post.file);
    if (!articleRes.ok) throw new Error('Not found');
    const html = await articleRes.text();
    document.getElementById('postBody').innerHTML = html;
  } catch (e) {
    document.getElementById('postBody').innerHTML =
      `<p><em>Article content could not be loaded. Make sure <code>${post.file}</code> exists.</em></p>`;
  }
}

// ── INIT ─────────────────────────────────────────────────────
if (isPostPage) {
  initPost();
} else {
  initIndex();
}
