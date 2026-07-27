import fs from 'node:fs';
import path from 'node:path';
import { buildProjects } from './lib/projects.mjs';
import { buildPosts } from './lib/posts.mjs';

const ROOT_DIR = process.cwd();
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PARTIALS_DIR = path.join(PUBLIC_DIR, 'partials');

fs.mkdirSync(path.join(PARTIALS_DIR, 'projects'), { recursive: true });
fs.mkdirSync(path.join(PARTIALS_DIR, 'blog'), { recursive: true });
fs.mkdirSync(path.join(CONTENT_DIR, 'projects'), { recursive: true });
fs.mkdirSync(path.join(CONTENT_DIR, 'posts'), { recursive: true });

console.log('Building content from ./content/...');
const projects = buildProjects(CONTENT_DIR, PARTIALS_DIR);
const posts = buildPosts(CONTENT_DIR, PARTIALS_DIR, PUBLIC_DIR);

// Build search index JSON
const searchIndex = {
  projects: projects.map(({ body, ...meta }) => meta),
  posts: posts.map(({ body, ...meta }) => meta),
};
fs.writeFileSync(path.join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(searchIndex, null, 2), 'utf-8');
console.log(`Successfully compiled ${projects.length} projects and ${posts.length} posts.`);
