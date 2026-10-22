import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Section, ButtonLink, Arrow } from "@/components/ui";
import { MerchByBrand } from "@/components/Merch";

export const metadata: Metadata = { title: "Merch", description: "Apparel from Flavorful Music. Coming soon.", alternates: { canonical: "/shop/merch" } };

export default function MerchPage() {
  return (
    <>
      <PageHeader kicker="Shop" title="Merch" accent="#B6FF3B">
        Apparel from the crew. Swipe any piece to see it front, back, on a model and in every color.
      </PageHeader>
      <Section id="merch" action={<ButtonLink href="/shop" variant="secondary">Back to shop <Arrow /></ButtonLink>}>
        <MerchByBrand />
      </Section>
    </>
  );
}
