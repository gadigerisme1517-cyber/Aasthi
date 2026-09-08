export type LocationOption = {
  id: string;
  name: string;
  district: string;
  state: string;
  type: "City" | "Town" | "Mandal" | "Village" | "Area";
  aliases?: string[];
  popular?: boolean;
  lat?: number;
  lng?: number;
};

export const DEFAULT_LOCATION_ID = "kurnool";

export const LOCATIONS: LocationOption[] = [
  { id: "all", name: "All locations", district: "All", state: "India", type: "City", aliases: ["anywhere", "all cities"], popular: true },
  { id: "kurnool", name: "Kurnool", district: "Kurnool", state: "Andhra Pradesh", type: "City", aliases: ["Kurnool city"], popular: true, lat: 15.8281, lng: 78.0373 },
  { id: "adoni", name: "Adoni", district: "Kurnool", state: "Andhra Pradesh", type: "Town", aliases: ["Adhoni"], popular: true, lat: 15.6322, lng: 77.2728 },
  { id: "yemmiganur", name: "Yemmiganur", district: "Kurnool", state: "Andhra Pradesh", type: "Town", aliases: ["Emmiganur"], popular: true },
  { id: "mantralayam", name: "Mantralayam", district: "Kurnool", state: "Andhra Pradesh", type: "Town", aliases: ["Mantralaya"], popular: true },
  { id: "dhone", name: "Dhone", district: "Nandyal", state: "Andhra Pradesh", type: "Town", aliases: ["Dronachalam"], popular: true },
  { id: "nandyal", name: "Nandyal", district: "Nandyal", state: "Andhra Pradesh", type: "City", aliases: ["Nandyala"], popular: true },
  { id: "atmakur-nandyal", name: "Atmakur", district: "Nandyal", state: "Andhra Pradesh", type: "Town", aliases: ["Atmakur Nandyal"], popular: true },
  { id: "banaganapalle", name: "Banaganapalle", district: "Nandyal", state: "Andhra Pradesh", type: "Town", aliases: ["Banganapalle"], popular: true },
  { id: "allagadda", name: "Allagadda", district: "Nandyal", state: "Andhra Pradesh", type: "Town", popular: true },
  { id: "bethamcherla", name: "Bethamcherla", district: "Nandyal", state: "Andhra Pradesh", type: "Town" },
  { id: "koilkuntla", name: "Koilkuntla", district: "Nandyal", state: "Andhra Pradesh", type: "Town", aliases: ["Koilakuntla"] },
  { id: "kodumur", name: "Kodumur", district: "Kurnool", state: "Andhra Pradesh", type: "Mandal" },
  { id: "pattikonda", name: "Pattikonda", district: "Kurnool", state: "Andhra Pradesh", type: "Town" },
  { id: "alur", name: "Alur", district: "Kurnool", state: "Andhra Pradesh", type: "Town" },
  { id: "gudur-kurnool", name: "Gudur", district: "Kurnool", state: "Andhra Pradesh", type: "Mandal", aliases: ["Gudur Kurnool"] },
  { id: "orvakal", name: "Orvakal", district: "Kurnool", state: "Andhra Pradesh", type: "Mandal", aliases: ["Orvakallu"] },
  { id: "veldurthi", name: "Veldurthi", district: "Kurnool", state: "Andhra Pradesh", type: "Mandal" },
  { id: "gonegandla", name: "Gonegandla", district: "Kurnool", state: "Andhra Pradesh", type: "Mandal" },
  { id: "kallur", name: "Kallur", district: "Kurnool", state: "Andhra Pradesh", type: "Area", aliases: ["Kallur Kurnool"] },
  { id: "nandyal-road", name: "Nandyal Road", district: "Kurnool", state: "Andhra Pradesh", type: "Area", aliases: ["Nandyal Rd"] },
  { id: "bellary-chowrasta", name: "Bellary Chowrasta", district: "Kurnool", state: "Andhra Pradesh", type: "Area", aliases: ["Ballari Chowrasta"] },
  { id: "ashok-nagar-kurnool", name: "Ashok Nagar", district: "Kurnool", state: "Andhra Pradesh", type: "Area", aliases: ["Ashok Nagar Kurnool"] },
  { id: "hyderabad", name: "Hyderabad", district: "Hyderabad", state: "Telangana", type: "City", aliases: ["Hyd", "Greater Hyderabad"], popular: true, lat: 17.385, lng: 78.4867 },
  { id: "secunderabad", name: "Secunderabad", district: "Hyderabad", state: "Telangana", type: "City", popular: true },
  { id: "gachibowli", name: "Gachibowli", district: "Rangareddy", state: "Telangana", type: "Area", popular: true },
  { id: "madhapur", name: "Madhapur", district: "Rangareddy", state: "Telangana", type: "Area", popular: true },
  { id: "kukatpally", name: "Kukatpally", district: "Medchal Malkajgiri", state: "Telangana", type: "Area", popular: true },
  { id: "miyapur", name: "Miyapur", district: "Rangareddy", state: "Telangana", type: "Area", popular: true },
  { id: "uppal", name: "Uppal", district: "Medchal Malkajgiri", state: "Telangana", type: "Area" },
  { id: "lb-nagar", name: "LB Nagar", district: "Rangareddy", state: "Telangana", type: "Area", aliases: ["L B Nagar"] },
  { id: "shamshabad", name: "Shamshabad", district: "Rangareddy", state: "Telangana", type: "Town" },
  { id: "warangal", name: "Warangal", district: "Warangal", state: "Telangana", type: "City", popular: true },
  { id: "karimnagar", name: "Karimnagar", district: "Karimnagar", state: "Telangana", type: "City" },
  { id: "khammam", name: "Khammam", district: "Khammam", state: "Telangana", type: "City" },
  { id: "nizamabad", name: "Nizamabad", district: "Nizamabad", state: "Telangana", type: "City" },
  { id: "anantapur", name: "Anantapur", district: "Anantapur", state: "Andhra Pradesh", type: "City", aliases: ["Anantapuramu"], popular: true },
  { id: "kadapa", name: "Kadapa", district: "YSR Kadapa", state: "Andhra Pradesh", type: "City", aliases: ["Cuddapah"], popular: true },
  { id: "tirupati", name: "Tirupati", district: "Tirupati", state: "Andhra Pradesh", type: "City", popular: true },
  { id: "vijayawada", name: "Vijayawada", district: "NTR", state: "Andhra Pradesh", type: "City", popular: true },
  { id: "guntur", name: "Guntur", district: "Guntur", state: "Andhra Pradesh", type: "City" },
  { id: "visakhapatnam", name: "Visakhapatnam", district: "Visakhapatnam", state: "Andhra Pradesh", type: "City", aliases: ["Vizag"], popular: true },
  { id: "rajahmundry", name: "Rajahmundry", district: "East Godavari", state: "Andhra Pradesh", type: "City", aliases: ["Rajamahendravaram"] },
  { id: "nellore", name: "Nellore", district: "SPSR Nellore", state: "Andhra Pradesh", type: "City" },
  { id: "ongole", name: "Ongole", district: "Prakasam", state: "Andhra Pradesh", type: "City" },
  { id: "hindupur", name: "Hindupur", district: "Sri Sathya Sai", state: "Andhra Pradesh", type: "Town" },
  { id: "penukonda", name: "Penukonda", district: "Sri Sathya Sai", state: "Andhra Pradesh", type: "Town" },
  { id: "tadipatri", name: "Tadipatri", district: "Anantapur", state: "Andhra Pradesh", type: "Town" },
  { id: "proddatur", name: "Proddatur", district: "YSR Kadapa", state: "Andhra Pradesh", type: "Town" },
  { id: "rayachoti", name: "Rayachoti", district: "Annamayya", state: "Andhra Pradesh", type: "Town" }
];

export function locationById(id?: string | null) {
  return LOCATIONS.find((location) => location.id === id) ?? LOCATIONS.find((location) => location.id === DEFAULT_LOCATION_ID)!;
}

export function searchLocations(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return LOCATIONS;
  return LOCATIONS.filter((location) => {
    const haystack = [location.name, location.district, location.state, location.type, ...(location.aliases ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function listingMatchesLocation(listing: Record<string, any>, location: LocationOption) {
  if (location.id === "all") return true;
  const values = [
    listing.city,
    listing.town,
    listing.mandal,
    listing.locality,
    listing.district,
    listing.state,
    listing.addr,
    listing.title,
    listing.locationSearchText,
  ];
  const haystack = values.filter(Boolean).join(" ").toLowerCase();
  const needles = [location.name, location.district, location.state, ...(location.aliases ?? [])]
    .filter(Boolean)
    .map((value) => value.toLowerCase());
  return needles.some((needle) => haystack.includes(needle));
}