export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export interface FrontmatterData {
  title?: string;
  description?: string;
  date?: string;
  year?: string;
  readTime?: string;
  tags?: string[];
  slug?: string;
  repository?: string;
  [key: string]: unknown;
}

export interface ProjectItem extends FrontmatterData {
  slug: string;
  title: string;
  description: string;
  year?: string;
  repository?: string;
  tags?: string[];
  body?: string;
}

export interface PostItem extends FrontmatterData {
  slug: string;
  title: string;
  description: string;
  date?: string;
  readTime?: string;
  tags?: string[];
  body?: string;
}

export interface SearchIndex {
  projects: Omit<ProjectItem, 'body'>[];
  posts: Omit<PostItem, 'body'>[];
}
