export interface Frontmatter {
  data: Record<string, string>;
  body: string;
}

export function parseFrontmatter(raw: string): Frontmatter {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter block (--- ... ---)");
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const colon = line.indexOf(":");
    if (colon === -1) throw new Error(`Bad frontmatter line: "${line}"`);
    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
    if (quoted && value.length >= 2) value = value.slice(1, -1);
    data[key] = value;
  }
  return { data, body: match[2] };
}
