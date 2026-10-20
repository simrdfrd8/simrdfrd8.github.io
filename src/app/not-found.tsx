import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="px-5 py-32 text-center">
      <p className="kicker text-muted">404</p>
      <h1 className="display mt-3 text-8xl">Lost the beat</h1>
      <p className="mt-4 text-cream-dim">That page isn&apos;t here.</p>
      <ButtonLink href="/" className="mt-8">
        Back home
      </ButtonLink>
    </section>
  );
}
