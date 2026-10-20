import { AGREEMENTS, publicMarkdown } from "@/lib/licenses";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => AGREEMENTS.map((a) => ({ slug: a.slug }));

/** Pre-generated at build time: out/licensing/<slug>/agreement.md (static file on GitHub Pages). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return new Response(publicMarkdown(slug), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
