// Seed data — identical content to the mockup's `sellers` and `listings`
// arrays so first run looks exactly the same. This is the local data layer;
// it swaps to Firestore collections when Firebase keys are provided.

export type Seller = {
  id: number;
  name: string;
  meta: string;
  trust: string; // "Top seller" | "Verified"
  verified: boolean;
  img: string;
  cover: string;
  sold: number;
  rating: string;
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
  verificationStatus?: string; // "pending" | "verified" | "rejected"
};

export const SELLERS: Seller[] = [
  {
    id: 0,
    name: "Sri Homes Realty",
    meta: "98% response · Independent houses",
    trust: "Top seller",
    verified: true,
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
    cover:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=500&q=80",
    sold: 87,
    rating: "4.9",
  },
  {
    id: 1,
    name: "Kurnool Estates",
    meta: "Fast reply · plots specialist",
    trust: "Verified",
    verified: true,
    img: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=300&q=80",
    cover:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=500&q=80",
    sold: 63,
    rating: "4.8",
  },
  {
    id: 2,
    name: "Urban Nest",
    meta: "Rentals and villas",
    trust: "Verified",
    verified: true,
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    cover:
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=500&q=80",
    sold: 51,
    rating: "4.7",
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
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=90",
    g: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=88",
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
    img: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=90",
    g: [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=88",
    ],
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
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=90",
    g: [
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=900&q=88",
    ],
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
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=90",
    g: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=88",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=88",
    ],
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
    body: "Sri Homes responded to your villa enquiry.",
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
