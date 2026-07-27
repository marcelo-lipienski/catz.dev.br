export function parseFrontmatter(rawContent) {
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

export function inlineFormatting(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-on-surface">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-surface-container-low px-1.5 py-0.5 rounded text-on-surface font-code-md text-sm">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function markdownToHtml(md) {
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
