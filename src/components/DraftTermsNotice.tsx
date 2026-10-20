import { LICENSE_TERMS_FINAL } from "@/lib/licenses";

/** Visible notice shown on licensing pages until the owner approves the final legal wording. */
export function DraftTermsNotice() {
  if (LICENSE_TERMS_FINAL) return null;
  return (
    <p role="note" data-draft-terms-notice className="mb-8 inline-flex items-center gap-2 rounded-full bg-raised px-4 py-2 text-sm ring-1 ring-line">
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#8C7CFF]" />
      Draft terms. Final wording coming soon.
    </p>
  );
}
