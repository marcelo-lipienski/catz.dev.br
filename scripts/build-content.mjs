import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PARTIALS_DIR = path.join(PUBLIC_DIR, 'partials');

fs.mkdirSync(path.join(PARTIALS_DIR, 'projects'), { recursive: true });
fs.mkdirSync(path.join(PARTIALS_DIR, 'blog'), { recursive: true });
fs.mkdirSync(path.join(CONTENT_DIR, 'projects'), { recursive: true });
fs.mkdirSync(path.join(CONTENT_DIR, 'posts'), { recursive: true });

function parseFrontmatter(rawContent) {
  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: rawContent };

  const yamlStr = match[1];
  const body = match[2];
  const data = {};

  for (const line of yamlStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    } else if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    }
    data[key] = val;
  }

  return { data, content: body };
}

function inlineFormatting(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-on-surface">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-surface-container-low px-1.5 py-0.5 rounded text-on-surface font-code-md text-sm">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
}

function markdownToHtml(md) {
  let html = md;

  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<div class="bg-surface-container-low border border-outline-variant/30 rounded-lg p-4 font-code-md text-sm text-on-surface overflow-x-auto my-4"><pre><code class="language-${lang || 'text'}">${escaped.trim()}</code></pre></div>`;
  });

  html = html.replace(/^### (.*$)/gim, '<h3 class="font-headline-sm text-headline-sm text-on-surface mt-6 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="font-headline-md text-headline-md text-on-surface mt-8 mb-4 border-b border-outline-variant/20 pb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="font-headline-lg text-headline-lg text-on-surface mt-8 mb-4">$1</h1>');
  html = html.replace(/^---$/gim, '<hr class="border-outline-variant/30 my-8"/>');
  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 py-2 italic text-secondary bg-surface-container-low/30 my-4">$1</blockquote>');

  html = html.replace(/^\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/gm, (_, headerRow, bodyRows) => {
    const headers = headerRow.split('|').map(s => s.trim()).filter(Boolean);
    const rows = bodyRows.trim().split('\n').map(r => r.split('|').map(s => s.trim()).filter(Boolean));

    const ths = headers.map(h => `<th class="py-3 px-4">${h}</th>`).join('');
    const trs = rows.map(row => {
      const tds = row.map((cell, idx) => `<td class="py-3 px-4 ${idx === 0 ? 'font-code-md text-primary' : 'text-secondary'}">${inlineFormatting(cell)}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    return `<div class="overflow-x-auto border border-outline-variant/30 rounded-lg my-6"><table class="w-full text-left text-sm"><thead class="bg-surface-container-low border-b border-outline-variant/30 font-label-caps text-label-caps text-outline uppercase"><tr>${ths}</tr></thead><tbody class="divide-y divide-outline-variant/20">${trs}</tbody></table></div>`;
  });

  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="text-secondary"><span class="text-on-surface font-body-md">$1</span></li>');
  html = html.replace(/(<li[\s\S]*?<\/li>\n?)+/g, '<ul class="space-y-2 list-disc list-inside my-4">$1</ul>');

  html = inlineFormatting(html);

  const paragraphs = html.split(/\n\n+/).map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<ul') || p.startsWith('<blockquote') || p.startsWith('<hr') || p.startsWith('<table')) {
      return p;
    }
    return `<p class="font-body-md text-body-md text-secondary leading-relaxed my-4">${p}</p>`;
  });

  return paragraphs.filter(Boolean).join('\n');
}

function buildProjects() {
  const projectsDir = path.join(CONTENT_DIR, 'projects');
  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md'));
  const projects = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
    const { data, content } = parseFrontmatter(raw);
    const slug = data.slug || path.basename(file, '.md');
    const project = { ...data, slug, body: content };
    projects.push(project);

    // Generate detailed partial
    const bodyHtml = markdownToHtml(content);
    const tags = Array.isArray(data.tags) ? data.tags : [];
    const detailHtml = `<main class="max-w-[800px] mx-auto px-margin pt-8 pb-16">
  <div class="mb-8">
    <a href="/projects" class="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-body-md">
      <span class="material-symbols-outlined text-sm">arrow_back</span>
      <span>Back to Projects</span>
    </a>
  </div>

  <header class="mb-12 border-b border-outline-variant/30 pb-8">
    <div class="flex items-center gap-3 mb-4">
      <span class="font-code-md text-label-caps text-primary uppercase tracking-wider">PROJECT</span>
      <span class="text-outline-variant">•</span>
      <span class="font-code-md text-label-caps text-outline uppercase tracking-wider">${data.year || ''}</span>
    </div>
    <h1 class="font-headline-lg text-headline-lg text-on-surface mb-4">${data.title || slug}</h1>
    <p class="font-body-lg text-body-lg text-secondary leading-relaxed">${data.description || ''}</p>

    <div class="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-outline-variant/20">
      ${data.repository ? `<a href="${data.repository}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container rounded font-label-caps text-label-caps hover:brightness-110 transition-all"><span class="material-symbols-outlined text-sm">code</span><span>GitHub Repository</span></a>` : ''}
      <div class="flex flex-wrap gap-2">
        ${tags.map(t => `<span class="px-2 py-0.5 bg-surface-container-low text-on-secondary-container rounded font-code-md text-[11px] border border-outline-variant/20 uppercase">${t}</span>`).join('')}
      </div>
    </div>
  </header>

  <article class="prose prose-slate max-w-none space-y-6 font-body-md text-on-surface">
    ${bodyHtml}
  </article>
</main>`;

    fs.writeFileSync(path.join(PARTIALS_DIR, 'projects', `${slug}.html`), detailHtml, 'utf-8');
  }

  // Sort projects by year / date descending
  projects.sort((a, b) => (b.date || b.year || '').localeCompare(a.date || a.year || ''));

  // Generate projects.html list partial
  const projectItemsHtml = projects.map((p, idx) => {
    const numStr = String(idx + 1).padStart(2, '0');
    const tags = Array.isArray(p.tags) ? p.tags : [];
    return `<article class="project-list-item py-10 group cursor-pointer border-b border-outline-variant/30 transition-all hover:bg-surface-container-low/40 px-4 -mx-4 rounded-lg" data-href="/projects/${p.slug}">
<div class="flex flex-col gap-3">
<div class="flex items-center gap-3">
<span class="font-code-md text-label-caps text-primary uppercase tracking-wider">PROJECT // ${numStr}</span>
<span class="text-outline-variant">•</span>
<span class="font-code-md text-label-caps text-outline uppercase tracking-wider">${p.year || ''}</span>
</div>
<h2 class="project-title font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors duration-200">${p.title}</h2>
<p class="font-body-md text-body-md text-secondary line-clamp-2 max-w-2xl">${p.description || ''}</p>
<div class="flex flex-wrap gap-2 mt-2">
${tags.map(t => `<span class="px-2 py-0.5 bg-surface-container-low text-on-secondary-container rounded font-code-md text-[11px] border border-outline-variant/20 uppercase">${t}</span>`).join('')}
</div>
</div>
</article>`;
  }).join('\n');

  const projectsListPartialHtml = `<main class="max-w-[800px] mx-auto px-margin pt-8 pb-8">
<header class="mb-16">
<h1 class="font-headline-lg text-headline-lg text-on-surface mb-4">Technical Index</h1>
<p class="font-body-lg text-body-lg text-secondary max-w-xl leading-relaxed">
            A repository of highly optimized systems, low-level CLI utilities, and performance-critical distributed infrastructure. Focused on memory safety, concurrent design, and the zen of efficient computation.
        </p>
</header>
<div class="flex items-center justify-between mb-12 py-4 border-y border-outline-variant/30">
<div class="flex items-center gap-2 text-secondary">
<span class="material-symbols-outlined text-sm">search</span>
<input class="bg-transparent border-none focus:ring-0 font-body-md text-body-md placeholder:text-outline p-0 w-32 md:w-64" placeholder="Search systems..." type="text"/>
</div>
<div class="flex items-center gap-4">
<span class="font-label-caps text-label-caps text-outline uppercase">Sorted by Relevance</span>
</div>
</div>
<section class="space-y-0">
${projectItemsHtml}
</section>
</main>
<script>
    document.querySelectorAll('.project-list-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('data-href');
            if (href) {
                e.preventDefault();
                history.pushState(null, '', href);
                if (typeof window.loadRoute === 'function') {
                    window.loadRoute(href);
                }
            }
        });
    });
</script>`;

  fs.writeFileSync(path.join(PARTIALS_DIR, 'projects.html'), projectsListPartialHtml, 'utf-8');

  return projects;
}

function buildPosts() {
  const postsDir = path.join(CONTENT_DIR, 'posts');
  const files = fs.existsSync(postsDir) ? fs.readdirSync(postsDir).filter(f => f.endsWith('.md')) : [];
  const posts = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const { data, content } = parseFrontmatter(raw);
    const slug = data.slug || path.basename(file, '.md');
    posts.push({ ...data, slug, body: content });
  }

  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return posts;
}

console.log('Building content from ./content/...');
const projects = buildProjects();
const posts = buildPosts();

// Build search index JSON
const searchIndex = {
  projects: projects.map(({ body, ...meta }) => meta),
  posts: posts.map(({ body, ...meta }) => meta),
};
fs.writeFileSync(path.join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(searchIndex, null, 2), 'utf-8');
console.log(`Successfully compiled ${projects.length} projects and ${posts.length} posts.`);
