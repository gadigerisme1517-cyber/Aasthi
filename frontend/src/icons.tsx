// Icon set mapping the mockup's inline SVG symbols to @expo/vector-icons.
// Same semantic names as the mockup (#bell, #searchIcon, #sliders, ...).
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";

export type IconName =
  | "bell"
  | "search"
  | "sliders"
  | "home"
  | "arrowLeft"
  | "heart"
  | "plus"
  | "user"
  | "scan"
  | "chev"
  | "camera"
  | "shield"
  | "gear"
  | "lifebuoy"
  | "info"
  | "logout"
  | "globe"
  | "check"
  | "moon"
  | "trash"
  | "star"
  | "message"
  // Added for the Enquiries tab. Deliberately NOT "message": a speech bubble
  // promises a conversation, and this app has no chat — an enquiry is a
  // one-way record. Feather's tray icon reads as an inbox instead.
  | "inbox"
  | "bug"
  | "phone"
  | "mapPin"
  // Stores get shared; profiles do not. Added with the storefront rebuild.
  | "share"
  // The browse view toggle.
  | "grid"
  | "rows"
  // Overflow on a half-width store tile, where three text buttons will not fit.
  | "more"
  | "close";

const FEATHER: Partial<Record<IconName, string>> = {
  bell: "bell",
  search: "search",
  sliders: "sliders",
  home: "home",
  arrowLeft: "arrow-left",
  plus: "plus",
  user: "user",
  scan: "maximize",
  chev: "chevron-right",
  camera: "camera",
  shield: "shield",
  gear: "settings",
  lifebuoy: "life-buoy",
  info: "info",
  logout: "log-out",
  globe: "globe",
  check: "check",
  moon: "moon",
  trash: "trash-2",
  star: "star",
  message: "message-circle",
  inbox: "inbox",
  phone: "phone",
  mapPin: "map-pin",
  share: "share-2",
  grid: "grid",
  rows: "list",
  more: "more-horizontal",
  close: "x",
};

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
};

export function Icon({ name, size = 21, color = "#101010", filled }: Props) {
  if (name === "heart") {
    return (
      <Ionicons
        name={filled ? "heart" : "heart-outline"}
        size={size + 1}
        color={color}
      />
    );
  }
  if (name === "star" && filled) {
    return <Ionicons name="star" size={size} color={color} />;
  }
  if (name === "bug") {
    return (
      <MaterialCommunityIcons name="bug-outline" size={size + 1} color={color} />
    );
  }
  const f = FEATHER[name] ?? "circle";
  return <Feather name={f as any} size={size} color={color} />;
}
