import { Listing } from "@/src/data/seed";

// THE ONE TYPE-SWITCH. Both the browse card and the compact row read from
// here, so the columns can never disagree between the two views. Nothing in
// this file renders; it decides what a listing HAS to say.

// The photo list, de-duplicated. `img` is the cover and `g` holds the REST,
// but listings written before that was settled still carry the cover twice.
// Both views call THIS, so a count badge can never disagree between them.
export function photosOf(listing: Listing): string[] {
  const rest = (listing.g ?? []).filter((u) => u && u !== listing.img);
  return [listing.img, ...rest].filter(Boolean) as string[];
}

export type Fact = { value: string; label: string };
export type Kind = "home" | "land" | "other";

const MISSING = "–";

function has(v: unknown): v is string {
  const s = String(v ?? "").trim();
  return s.length > 0 && s !== "-" && s !== MISSING;
}

function val(v: unknown): string {
  return has(v) ? String(v).trim() : MISSING;
}

// The number without its unit: "2,240 sq.ft" -> "2,240". The unit is the
// column label, so repeating it in the value wastes the width the label needs.
function bare(v: unknown): string {
  if (!has(v)) return MISSING;
  const first = String(v).trim().split(/\s+/)[0];
  return first || MISSING;
}

export function kindOf(listing: Listing): Kind {
  const t = `${(listing as any).propertyType ?? ""} ${listing.type ?? ""}`.toLowerCase();
  if (/plot|land|commercial|shop|office/.test(t)) return "land";
  if (/house|flat|apartment|villa|buy|rent/.test(t)) return "home";
  return "other";
}

// A type pill is only worth the space when the type is NOT already obvious
// from the plaque line and the columns. A flat says "3 BHK" and shows beds;
// a plot says neither, so it gets the pill.
export function showsTypePill(listing: Listing): boolean {
  return kindOf(listing) !== "home";
}

export function localityOf(listing: Listing): string {
  const first = String(listing.addr ?? "").split(",")[0].trim();
  return first || String(listing.addr ?? "").trim();
}

// Plaque line 2. "3 BHK, Nandyal Road" for a home, "Plots, Nandyal Road"
// otherwise. One line, the card ellipsises it.
export function plaqueLine(listing: Listing): string {
  const where = localityOf(listing);
  const kind = kindOf(listing);
  const label =
    kind === "home" && has(listing.beds)
      ? `${String(listing.beds).trim()} BHK`
      : (listing as any).propertyType?.trim() || listing.type;
  return [label, where].filter(Boolean).join(", ");
}

// SHORT LABELS ON PURPOSE. "Commercial" and "position" both overflowed a
// column at 360px, which is the narrowest phone this ships to.
export function factsFor(listing: Listing): Fact[] {
  const kind = kindOf(listing);

  if (kind === "home") {
    // floor only when there is no facing. A number, so 0 is ground floor and
    // must not read as missing — hence the typeof test rather than has().
    const hasFloor = typeof listing.floor === "number" && Number.isFinite(listing.floor);
    const third =
      hasFloor && !has(listing.facing)
        ? { value: String(listing.floor), label: "floor" }
        : { value: val(listing.facing), label: "facing" };
    return [
      { value: val(listing.beds), label: "bed" },
      { value: bare(listing.area), label: "sq ft" },
      third,
    ];
  }

  if (kind === "land") {
    // corner is a boolean: true -> "Yes", false -> "No", absent -> "–".
    // A listing that has never been asked the question is not a "No".
    const corner =
      typeof listing.corner === "boolean" ? (listing.corner ? "Yes" : "No") : MISSING;
    return [
      { value: bare(listing.area), label: "sq yd" },
      { value: val(listing.facing), label: "facing" },
      { value: corner, label: "corner" },
    ];
  }

  // Anything else: the three most populated numeric fields, in a fixed order
  // so two listings of the same shape never show different columns.
  const pool: Fact[] = [
    { value: val(listing.beds), label: "bed" },
    { value: val(listing.baths), label: "bath" },
    { value: bare(listing.area), label: "area" },
    { value: val(listing.facing), label: "facing" },
    { value: val(listing.dist), label: "away" },
  ];
  const filled = pool.filter((f) => f.value !== MISSING);
  const out = filled.slice(0, 3);
  while (out.length < 3) out.push(pool[out.length] ?? { value: MISSING, label: "—" });
  return out;
}

// LISTING STATE, derived. No status field was added and none is needed: all
// four states already exist in the data, they were simply never read
// together. Precedence is deliberate — a sold listing that was never
// verified reads Sold, because sold is the end of the story and the
// paperwork no longer matters.
export type ListingState = "sold" | "hidden" | "pending" | "active";

export function statusOf(listing: Listing): ListingState {
  const anyL = listing as any;
  if ((anyL.saleStatus ?? "live") === "sold") return "sold";
  if (anyL.hidden) return "hidden";
  if (anyL.verificationStatus !== "verified") return "pending";
  return "active";
}

export const STATE_LABEL: Record<ListingState, string> = {
  sold: "Sold",
  hidden: "Hidden",
  pending: "Pending verification",
  active: "Active",
};

// Column 4, always. A claim about whether AASTHI checked the documents.
export function trustFact(listing: Listing): { value: string; label: string; verified: boolean } {
  const verified = (listing as any).verificationStatus === "verified";
  return verified
    ? { value: "✓", label: "verified", verified: true }
    : { value: "○", label: "pending", verified: false };
}

export const FACT_MISSING = MISSING;
