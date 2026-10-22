import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Section, ButtonLink, Arrow } from "@/components/ui";
import { MerchShop } from "@/components/Merch";
import { CloserLook } from "@/components/CloserLook";
import { closerLookShop } from "@/lib/closerLook";

export const metadata: Metadata = { title: "Merch", description: "Apparel from Flavorful Music. Coming soon.", alternates: { canonical: "/shop/merch" } };

export default function MerchPage() {
  return (
    <>
      <PageHeader kicker="Shop" title="Merch" accent="#B6FF3B">
        Apparel from the crew. Swipe any piece to see it front, back, on a model and in every color.
      </PageHeader>
      <Section id="merch" action={<ButtonLink href="/shop" variant="secondary">Back to shop <Arrow /></ButtonLink>}>
        <MerchShop />
      </Section>
      <Section tone="raised">
        <CloserLook tiles={closerLookShop()} intro="the stuff you only notice once it's in your hands." />
      </Section>
    </>
  );
}
