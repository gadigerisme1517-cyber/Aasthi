import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

import { Empty, PageHead, Screen } from "@/src/components/ui";
import { Storefront } from "@/src/components/storefront";
import { auth } from "@/src/services/firebase";
import { useApp } from "@/src/store/AppContext";

// The PUBLIC storefront. Same template as the Profile tab.
//
// It used to be hardcoded to the buyer version even when the agent arrived at
// their own store. That was wrong: ownership is a fact about the uid, not
// about the route. When the uid is yours this renders the owner version, the
// same one the Profile tab shows, and "View as buyer" is still the way to
// preview it.
//
// Two kinds of store arrive here:
//   ?uid=  a real agent. Identity is reconstructed from the fields
//          denormalised onto their listings, because firestore.rules restricts
//          users/{uid} to its owner and a buyer cannot read it.
//   ?id=   a seeded seller from the `sellers` collection.

export default function SellerStore() {
  const { id, uid } = useLocalSearchParams<{ id?: string; uid?: string }>();
  const { sellers, listings, listingsBySeller } = useApp();
  const isMine = Boolean(uid) && uid === auth.currentUser?.uid;

  const mine = useMemo(
    () => (uid ? listings.filter((l) => (l as any).sellerUid === uid) : listingsBySeller(Number(id))),
    [uid, id, listings, listingsBySeller],
  );

  const identity = useMemo(() => {
    if (uid) {
      const any = mine[0] as any;
      if (!any) return null;
      return {
        key: uid,
        uid,
        name: any.sellerName || "AASTHI member",
        avatar: any.sellerAvatar,
        verified: Boolean(any.sellerVerified),
        city: (any.sellerCity || "").split(",")[0],
        area: any.sellerArea || "",
        bio: any.sellerBio || "",
      };
    }
    const s = sellers.find((x) => x.id === Number(id));
    if (!s) return null;
    return {
      key: s.id,
      name: s.name,
      avatar: s.img,
      verified: s.verified,
      // Was `s.meta`, so this storefront's location line read "98% response ·
      // Independent houses". Seeded sellers have no city on record, so the
      // line simply does not render for them until one is written.
      city: s.city ?? "",
      area: "",
      // Seeded sellers have no bio field; the block simply does not render.
      bio: "",
    };
  }, [uid, id, mine, sellers]);

  if (!identity) {
    return (
      <Screen header={<PageHead title="Store" />}>
        <Empty title="Store not found" body="This seller may have been removed." />
      </Screen>
    );
  }

  // WAS hardcoded false. Reaching your own store through this route — from
  // the "Listed by" row on one of your own listings, say — rendered it as a
  // stranger's: Follow, Share, and a muted line offering you your own number
  // after an inquiry. Ownership is a fact about the uid, not about the route
  // you arrived by.
  return <Storefront identity={identity} listings={mine} isOwner={isMine} />;
}
