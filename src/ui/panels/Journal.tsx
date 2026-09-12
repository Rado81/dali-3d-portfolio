import { journalPosts, postBySlug } from "../../content/journal";
import { useStore } from "../../store";

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function Journal() {
  const slug = useStore((s) => s.journalSlug);
  const post = slug ? postBySlug(slug) : undefined;

  if (post) {
    return (
      <article className="post">
        <a className="label post__back" href="#/journal">← All posts</a>
        <h2 className="display post__title">{post.title}</h2>
        <p className="label">{formatDate(post.date)} · {post.readingTime}</p>
        <div className="post__body" dangerouslySetInnerHTML={{ __html: post.html.replace(/<h2>/g, "<h3>").replace(/<\/h2>/g, "</h3>") }} />
      </article>
    );
  }

  return (
    <ul className="plain posts">
      {journalPosts.map((p) => (
        <li key={p.slug} className="posts__item">
          <p className="label">{formatDate(p.date)} · {p.readingTime}</p>
          <a className="posts__link" href={`#/journal/${p.slug}`}>{p.title}</a>
          <p className="posts__excerpt">{p.excerpt}</p>
        </li>
      ))}
    </ul>
  );
}
