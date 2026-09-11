// Seed data — identical content to the mockup's `sellers` and `listings`
// arrays so first run looks exactly the same. This is the local data layer;
// it swaps to Firestore collections when Firebase keys are provided.

export type Seller = {
  id: number;
  name: string;
  // `meta` used to sit here: one free-text line that was a marketing blurb on
  // one seller ("Rentals and villas"), an unsourced statistic on another
  // ("98% response"), and the seller's CITY when the object was built from a
  // real user. Four screens rendered it in a slot that meant "where this
  // seller is", so the statistic was being read as a location. It is deleted,
  // not renamed: what those screens actually wanted is below, as a fact with
  // one meaning.
  //
  // Optional because it is genuinely unknown for the three seeded sellers —
  // they have never had a city recorded anywhere. Absent means the line is not
  // rendered. It is never filled from a guess or from a listing's address.
  city?: string;
  trust: string; // "Top seller" | "Verified"
  verified: boolean;
  img: string;
  cover: string;
  // `sold` and `rating` used to live here. Both were hardcoded below with
  // nothing behind them — there is no reviews collection and no record of a
  // completed sale anywhere in this project — while a real seller was handed
  // `0` and `"-"` in the same slots. Deleted rather than left unset: an unset
  // field invites someone to fill it with a plausible number later. When
  // ratings become real they arrive with the collection that backs them.
  //
  // Set only for a seller identity built from a real user's own listing
  // (see sellerOf in AppContext). Seeded sellers leave both undefined and
  // keep using the numeric `id`. USER_SELLER_ID marks the synthetic case.
  uid?: string;
  phone?: string;
};

// Sentinel `Seller.id` for a seller identity derived from a user document
// rather than from the seeded `sellers` collection. Never collides: seeded
// ids start at 0 and count up.
export const USER_SELLER_ID = -1;

export type Listing = {
  id: string;
  type: "Buy" | "Rent" | "Plots" | "Commercial";
  price: string;
  title: string;
  addr: string;
  beds: string;
  baths: string;
  area: string;
  facing: string;
  // Both added with the four-column facts row. NEITHER has a substitute and
  // neither is back-filled: a listing written before they existed renders "–"
  // in that column until someone edits it. A number here would be a guess.
  //
  // floor is a NUMBER, so 0 means ground floor and reads as "0", not as
  // missing. The home columns use it only when facing is absent.
  floor?: number;
  // corner is a BOOLEAN, so false is an answer ("No") and undefined is not.
  corner?: boolean;
  dist: string;
  seller: number; // seller id
  img: string;
  g: string[];
  desc: string;
  vastu?: string;
  propertyType?: string;
  boosted?: boolean;
  // Written by publishListing. `seller` stays at USER_SELLER_ID for these and
  // the identity is read from the denormalised fields below, because
  // firestore.rules only lets a user read their OWN users/{uid} document —
  // there is no way to look another publisher's profile up at read time.
  sellerUid?: string;
  sellerName?: string;
  sellerAvatar?: string;
  sellerCity?: string;
  sellerPhone?: string;
  // Storefront identity, denormalised for the same reason as sellerName:
  // users/{uid} is readable only by its owner.
  sellerBio?: string;
  sellerArea?: string;
  sellerVerified?: boolean;
  verificationStatus?: string; // "pending" | "verified" | "rejected"
  // A DIFFERENT CLAIM from verificationStatus. That one is about whether
  // AASTHI checked the documents; this is about whether the property is
  // still for sale. A listing can be Verified and Sold at the same time.
  saleStatus?: SaleStatus; // default "live" when absent
  // Stamped at the MOMENT the owner flips each switch, and only on the
  // transition — editing a hidden listing's title does not reset hiddenAt,
  // because that would be a lie about when it was hidden.
  //
  // NOT BACKFILLED. Every listing hidden or sold before these existed has
  // neither, and its tile keeps reading a plain "Hidden" or "Sold" with no
  // date. A date derived from createdAt would be a date that means nothing.
  hiddenAt?: any;
  soldAt?: any;
  // Incremented once per /detail open by anyone who is not the owner.
  // Absent on every listing published before this existed — the UI shows a
  // dash for that, never 0, because "we never counted" is not "nobody looked".
  views?: number;
  // Hidden by its owner from Home, Search and the public storefront. Distinct
  // from sold: the property is still available, the agent just does not want
  // it shown right now. Only the owner sees it, under the Hidden chip.
  hidden?: boolean;
};

export type SaleStatus = "live" | "token" | "sold";

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  live: "Live",
  token: "Token paid",
  sold: "Sold",
};

export const SELLERS: Seller[] = [
  {
    id: 0,
    name: "Sri Homes Realty",
    city: "Kurnool",
    trust: "Top seller",
    verified: true,
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
    cover:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 1,
    name: "Kurnool Estates",
    city: "Kurnool",
    trust: "Verified",
    verified: true,
    img: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=300&q=80",
    cover:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 2,
    name: "Urban Nest",
    city: "Kurnool",
    trust: "Verified",
    verified: true,
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    cover:
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=500&q=80",
  },
];

export const LISTINGS: Listing[] = [
  {
    id: "1",
    type: "Buy",
    price: "₹1.34 Cr",
    title: "Quiet luxury villa with 360° walkthrough",
    addr: "Nandyal Road, Kurnool",
    beds: "4",
    baths: "4",
    area: "3,200",
    facing: "East",
    dist: "2.1 km",
    seller: 0,
    // Independent house, Virudhunagar. Three real Indian houses rather than
    // one western villa shot from a drone.
    img: "https://images.pexels.com/photos/35289099/pexels-photo-35289099.jpeg?auto=compress&cs=tinysrgb&w=800",
    g: [
      "https://images.pexels.com/photos/34968154/pexels-photo-34968154.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/31959779/pexels-photo-31959779.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    desc: "A premium independent villa with wide road access, bright interiors, elegant finishes and a guided 360° tour that lets serious buyers understand the space before visiting.",
  },
  {
    id: "2",
    type: "Rent",
    price: "₹42,000/mo",
    title: "Fully furnished apartment near city centre",
    addr: "Ashok Nagar, Kurnool",
    beds: "3",
    baths: "3",
    area: "1,740",
    facing: "North",
    dist: "1.4 km",
    seller: 2,
    // Apartment interiors, Hyderabad. A rental is let on what the rooms
    // look like, so both photos are inside.
    img: "https://images.pexels.com/photos/7672058/pexels-photo-7672058.jpeg?auto=compress&cs=tinysrgb&w=800",
    g: ["https://images.pexels.com/photos/7672060/pexels-photo-7672060.jpeg?auto=compress&cs=tinysrgb&w=800"],
    desc: "A calm, fully furnished rental with strong natural light, lift access, parking and close access to daily essentials.",
  },
  {
    id: "3",
    type: "Plots",
    price: "₹68 L",
    title: "Premium east-facing residential plot",
    addr: "Panchalingala Road, Kurnool",
    beds: "-",
    baths: "-",
    area: "266 yd",
    facing: "East",
    dist: "4.8 km",
    seller: 1,
    // Open plot. ONE photo, because there is exactly one plot picture in the
    // approved set and a plot listing with a single photograph is what a real
    // one looks like anyway.
    img: "https://images.pexels.com/photos/34359456/pexels-photo-34359456.jpeg?auto=compress&cs=tinysrgb&w=800",
    g: [],
    desc: "Clear-title residential plot with strong road visibility, clean layout access and a calm developing neighbourhood.",
  },
  {
    id: "4",
    type: "Commercial",
    price: "₹96 L",
    title: "Main road commercial shop frontage",
    addr: "Bellary Chowrasta, Kurnool",
    beds: "-",
    baths: "1",
    area: "820",
    facing: "West",
    dist: "0.8 km",
    seller: 1,
    // THE WEAKEST MATCH IN THE SET, and it is named as such in the report:
    // there is no shopfront among the approved photos, so this is a street
    // exterior in Bhubaneswar and rooftops in Tanda. Both are Indian and
    // neither is a shop.
    img: "https://images.pexels.com/photos/29547315/pexels-photo-29547315.jpeg?auto=compress&cs=tinysrgb&w=800",
    g: ["https://images.pexels.com/photos/17499591/pexels-photo-17499591.jpeg?auto=compress&cs=tinysrgb&w=800"],
    desc: "Compact commercial frontage with high visibility, clean access and practical fit-out potential for local business use.",
  },
];

export const CATEGORIES = ["All", "Buy", "Rent", "Plots", "Commercial"] as const;

export type Settings = {
  pushNew: boolean;
  pushPrice: boolean;
  pushMsg: boolean;
  pushPromo: boolean;
  emailUpdates: boolean;
  profileVisible: boolean;
  showContact: boolean;
  personalized: boolean;
  activityStatus: boolean;
  darkMode: boolean;
  language: string;
  currency: string;
};

export const DEFAULT_SETTINGS: Settings = {
  pushNew: true,
  pushPrice: true,
  pushMsg: true,
  pushPromo: false,
  emailUpdates: true,
  profileVisible: true,
  showContact: true,
  personalized: true,
  activityStatus: false,
  darkMode: false,
  language: "English",
  currency: "₹ INR",
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  ts: number;
};

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Seller replied",
    body: "Sri Homes responded to your villa inquiry.",
    ts: Date.now() - 3600_000,
  },
  {
    id: "n2",
    title: "New 360° tour",
    body: "A verified property in Nandyal Road added an immersive walkthrough.",
    ts: Date.now() - 7200_000,
  },
];

export const APP_VERSION = "2.4.1";
