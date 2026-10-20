import supportJson from "@content/support.json";
import { supportProduct } from "@/lib/catalog";
import { CheckoutButton } from "./CheckoutButton";
import { ButtonLink } from "./ui";

export function SupportBand({ title = "Keep the workshop running." }: { title?: string }) {
  const p = supportProduct();
  if (!p) return null;
  return (
    <section aria-labelledby="support-band" className="bg-cream px-5 py-16 text-ink sm:px-8 md:py-24 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] items-end gap-10 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="kicker mb-4 text-ink/70">Pay what you want</p>
          <h2 id="support-band" className="display text-6xl sm:text-7xl md:text-8xl">
            {title}
          </h2>
          <p className="mt-5 max-w-lg text-lg text-ink/80">Everything here is free to stream. If a song stuck with you, chip in. It pays for the next one.</p>
        </div>
        <div>
          <div className="flex flex-wrap gap-3" role="group" aria-label="Quick support amounts">
            {supportJson.amounts.map((a) => (
              <CheckoutButton key={a} product={p} amount={a} priceLabel={`$${a}`} label={`$${a}`} size="lg" variant="primary" className="!bg-ink !text-cream hover:!bg-black" />
            ))}
          </div>
          <ButtonLink href="/support" variant="ghost" className="mt-5 !px-0 !text-ink/80 hover:!text-ink">
            Monthly memberships →
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
