import BlogPostClient from "./BlogPostClient";

export function generateStaticParams() {
  return [{ slug: "welcome" }];
}

export default function BlogPostPage() {
  return <BlogPostClient />;
}
