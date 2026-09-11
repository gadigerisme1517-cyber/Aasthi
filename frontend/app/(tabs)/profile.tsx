import { auth } from "@/src/services/firebase";
import { Storefront } from "@/src/components/storefront";
import { useApp } from "@/src/store/AppContext";

// The Profile tab opens the agent's OWN STORE, not a settings list.
// Everything that used to live here — Account, Get verified, Privacy,
// Settings, Notifications, Help, About, Saved, Property Partner, Premium,
// Blocked and Log out — now sits behind the gear in the storefront's top bar,
// at /menu. Nothing was removed; see that screen.
//
// This file is a wrapper on purpose. There is exactly ONE storefront template
// (src/components/storefront.tsx) and both audiences render it, so the agent's
// view can never drift into being a different screen from the buyer's.

export default function Profile() {
  const { user, myListings } = useApp();
  const uid = auth.currentUser?.uid;

  return (
    <Storefront
      isOwner
      identity={{
        key: uid,
        uid,
        name: user.businessName?.trim() || user.name || "AASTHI member",
        avatar: user.avatar,
        cover: user.cover,
        verified: user.verified,
        city: user.city?.split(",")[0],
        area: user.operatingAreas,
        bio: user.bio,
        // "Agent", "Broker", "Builder"… set in /property-partner. Absent
        // until that form is filled, and the header falls back to
        // "Property dealer" rather than inventing a trade.
        kind: (user as any).partnerType,
        // "On AASTHI" reads the account's own createdAt. Accounts made
        // before that field existed have none, and the cell shows "–"
        // rather than a joining date invented from nothing.
        since: (user as any).createdAt,
        // followers is left undefined ON PURPOSE — see the note on the type.
        // Nothing can count it from a client under the current rules.
      }}
      listings={myListings}
    />
  );
}
