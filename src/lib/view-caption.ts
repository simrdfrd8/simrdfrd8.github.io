/**
 * Caption parts after the colorway name: the current view, plus the back choice when the product offers one.
 * On a back view the choice is folded into the label ("Back (blank)") so it never reads "· Back · Blank back".
 */
export function viewCaption(view: { kind: string; label: string } | undefined, hasBackChoice: boolean, blank: boolean): string[] {
  const choice = blank ? "blank" : "printed";
  if (view && hasBackChoice && view.kind === "back") return [`Back (${choice})`];
  if (view && hasBackChoice && view.kind === "model-back") return [`On model, back (${choice})`];
  // extra people are photographed in the printed back only
  if (view && hasBackChoice && view.kind === "model-back-extra") return ["On model, back (printed)"];
  const out = view && view.kind !== "front" ? [view.label] : [];
  if (hasBackChoice) out.push(blank ? "Blank back" : "Printed back");
  return out;
}
