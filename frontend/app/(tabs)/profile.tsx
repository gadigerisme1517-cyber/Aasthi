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

// Epoch ms for when this account was created. Auth first, then the profile
// document, then nothing — never a guess.
function accountCreatedAt(): number | undefined {
  const fromAuth = auth.currentUser?.metadata?.creationTime;
  const parsed = fromAuth ? Date.parse(fromAuth) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

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
        // "On AASTHI". The users document only carries createdAt for accounts
        // that went through profile-setup AFTER that field was added, which
        // is why this read "–" on an older account. The Firebase Auth record
        // always knows when the account was made, is not self-declared, and
        // cannot be edited by the user — so it is the better source and the
        // stored value is only a fallback for the same fact.
        since: accountCreatedAt(),
        // followers is left undefined ON PURPOSE — see the note on the type.
        // Nothing can count it from a client under the current rules.
      }}
      listings={myListings}
    />
  );
}
