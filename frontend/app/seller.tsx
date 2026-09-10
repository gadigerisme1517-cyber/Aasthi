import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

import { Empty, PageHead, Screen } from "@/src/components/ui";
import { Storefront } from "@/src/components/storefront";
import { useApp } from "@/src/store/AppContext";

// The PUBLIC storefront. Same template as the Profile tab, rendered for a
// buyer. This route is always the buyer version, including when the agent
// reaches it themselves — /seller IS the public page, and previewing your own
// store is a mode switch on the Profile tab, not this route.
//
// Two kinds of store arrive here:
//   ?uid=  a real agent. Identity is reconstructed from the fields
//          denormalised onto their listings, because firestore.rules restricts
//          users/{uid} to its owner and a buyer cannot read it.
//   ?id=   a seeded seller from the `sellers` collection.

export default function SellerStore() {
  const { id, uid } = useLocalSearchParams<{ id?: string; uid?: string }>();
  const { sellers, listings, listingsBySeller } = useApp();

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
      city: s.meta,
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

  return <Storefront identity={identity} listings={mine} isOwner={false} />;
}
