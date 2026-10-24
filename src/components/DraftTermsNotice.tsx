import { isTermsFinal } from "@/lib/licenses";

/**
 * Visible notice on a draft agreement (Stems Lease, Exclusive Rights) until the owner approves its final wording.
 * Never shown for the MP3/WAV leases, which are covered by the final Beat Lease License.
 */
export function DraftTermsNotice({ slug }: { slug: string }) {
  if (isTermsFinal(slug)) return null;
  return (
    <p role="note" data-draft-terms-notice className="mb-8 inline-flex items-center gap-2 rounded-full bg-raised px-4 py-2 text-sm ring-1 ring-line">
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#8C7CFF]" />
      Coming soon. Draft terms; final wording to follow.
    </p>
  );
}
