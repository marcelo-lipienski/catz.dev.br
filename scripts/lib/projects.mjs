import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, markdownToHtml } from './parser.mjs';

export function buildProjects(contentDir, partialsDir) {
  const projectsDir = path.join(contentDir, 'projects');
  const files = fs.existsSync(projectsDir) ? fs.readdirSync(projectsDir).filter(f => f.endsWith('.md')) : [];
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
    const detailHtml = `<main class="max-w-[800px] mx-auto px-margin pt-8 pb-8">
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

    fs.writeFileSync(path.join(partialsDir, 'projects', `${slug}.html`), detailHtml, 'utf-8');
  }

  // Sort projects by year / date descending
  projects.sort((a, b) => (b.date || b.year || '').localeCompare(a.date || a.year || ''));

  // Generate projects.html list partial
  const projectItemsHtml = projects.map((p, idx) => {
    const numStr = String(idx + 1).padStart(2, '0');
    const tags = Array.isArray(p.tags) ? p.tags : [];
    return `<article class="project-list-item py-10 group cursor-pointer border-b border-outline-variant/30 transition-all hover:bg-surface-container-low/40 px-4 -mx-4 rounded-lg">
<a href="/projects/${p.slug}" class="flex flex-col gap-3 block text-inherit no-underline">
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
</a>
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
</main>`;

  fs.writeFileSync(path.join(partialsDir, 'projects.html'), projectsListPartialHtml, 'utf-8');

  return projects;
}
