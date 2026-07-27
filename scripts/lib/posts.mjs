import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, markdownToHtml } from './parser.mjs';

export function buildPosts(contentDir, partialsDir, publicDir) {
  const postsDir = path.join(contentDir, 'posts');
  const files = fs.existsSync(postsDir) ? fs.readdirSync(postsDir).filter(f => f.endsWith('.md')) : [];
  const posts = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const { data, content } = parseFrontmatter(raw);
    const slug = data.slug || path.basename(file, '.md');
    posts.push({ ...data, slug, body: content });

    // Generate detailed blog partial under /partials/blog/<slug>.html
    const bodyHtml = markdownToHtml(content);
    const tags = Array.isArray(data.tags) ? data.tags : [];
    const detailHtml = `<main class="max-w-[800px] mx-auto px-margin pt-8 pb-16">
  <div class="mb-8">
    <a href="/" class="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-body-md">
      <span class="material-symbols-outlined text-sm">arrow_back</span>
      <span>Back to Blog</span>
    </a>
  </div>

  <header class="mb-12 border-b border-outline-variant/30 pb-8">
    <div class="flex items-center gap-3 mb-4">
      <time class="font-code-md text-label-caps text-primary uppercase tracking-wider" datetime="${data.date || ''}">${data.date || ''}</time>
      ${data.readTime ? `<span class="text-outline-variant">•</span><span class="font-code-md text-label-caps text-outline uppercase tracking-wider">${data.readTime}</span>` : ''}
    </div>
    <h1 class="font-headline-lg text-headline-lg text-on-surface mb-4">${data.title || slug}</h1>
    <p class="font-body-lg text-body-lg text-secondary leading-relaxed">${data.description || ''}</p>

    <div class="flex flex-wrap gap-2 mt-6 pt-6 border-t border-outline-variant/20">
      ${tags.map(t => `<span class="px-2 py-0.5 bg-surface-container-low text-on-secondary-container rounded font-code-md text-[11px] border border-outline-variant/20 uppercase">${t}</span>`).join('')}
    </div>
  </header>

  <article class="prose prose-slate max-w-none space-y-6 font-body-md text-on-surface">
    ${bodyHtml}
  </article>
</main>`;

    fs.writeFileSync(path.join(partialsDir, 'blog', `${slug}.html`), detailHtml, 'utf-8');
  }

  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Generate blog.html list partial under /partials/blog.html
  const postItemsHtml = posts.map((p) => {
    const tags = Array.isArray(p.tags) ? p.tags : [];
    return `<article class="blog-list-item py-10 group cursor-pointer border-b border-outline-variant/30 transition-all hover:bg-surface-container-low/40 px-4 -mx-4 rounded-lg">
<a href="/blog/${p.slug}" class="flex flex-col gap-3 block text-inherit no-underline">
<div class="flex items-center gap-3">
<time class="font-code-md text-label-caps text-outline uppercase tracking-wider" datetime="${p.date || ''}">${p.date || ''}</time>
${p.readTime ? `<span class="text-outline-variant">•</span><span class="font-code-md text-label-caps text-outline uppercase tracking-wider">${p.readTime}</span>` : ''}
</div>
<h2 class="blog-title font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors duration-200">${p.title}</h2>
<p class="font-body-md text-body-md text-secondary line-clamp-2 max-w-2xl">${p.description || ''}</p>
<div class="flex flex-wrap gap-2 mt-2">
${tags.map(t => `<span class="px-2 py-0.5 bg-surface-container-low text-on-secondary-container rounded font-code-md text-[11px] border border-outline-variant/20 uppercase">${t}</span>`).join('')}
</div>
</a>
</article>`;
  }).join('\n');

  const blogListPartialHtml = `<main class="max-w-[800px] mx-auto px-margin pt-8 pb-8">
<header class="mb-16">
<h1 class="font-headline-lg text-headline-lg text-on-surface mb-4">Engineering Blog</h1>
<p class="font-body-lg text-body-lg text-secondary max-w-xl leading-relaxed">
                Thoughts on distributed systems, CLI tool design, and software craftsmanship.
            </p>
</header>
<div class="flex items-center justify-between mb-12 py-4 border-y border-outline-variant/30">
<div class="flex items-center gap-2 text-secondary">
<span class="material-symbols-outlined text-sm">search</span>
<input class="bg-transparent border-none focus:ring-0 font-body-md text-body-md placeholder:text-outline p-0 w-32 md:w-64" placeholder="Search posts..." type="text"/>
</div>
<div class="flex items-center gap-4">
<span class="font-label-caps text-label-caps text-outline uppercase">Sorted by Date</span>
</div>
</div>
<section class="space-y-0">
${postItemsHtml || '<p class="text-secondary py-8">No blog posts found.</p>'}
</section>
</main>`;

  fs.writeFileSync(path.join(partialsDir, 'blog.html'), blogListPartialHtml, 'utf-8');

  // Inject blog list into index.html main element for SSG initial load
  const indexHtmlPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
    indexHtml = indexHtml.replace(/<main[\s\S]*?<\/main>/, blogListPartialHtml);
    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf-8');
  }

  return posts;
}
