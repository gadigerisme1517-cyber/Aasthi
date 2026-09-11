import { Image } from "expo-image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Field, T } from "@/src/components/ui";
import { Icon } from "@/src/icons";
import { adminApi } from "@/src/services/adminApi";
import { auth } from "@/src/services/firebase";
import { signOutUser } from "@/src/services/db";
import { googleErrorMessage, googleSignIn } from "@/src/services/authProviders";
import { colors, shadow } from "@/src/theme";

type Phase = "checking" | "login" | "denied" | "dash";
type Tab = "verifications" | "listings" | "bugs";

export default function Admin() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState<Tab>("verifications");
  const [overview, setOverview] = useState<any>({});
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const verifyAdmin = useCallback(async () => {
    try {
      await adminApi.check();
      setPhase("dash");
    } catch (e: any) {
      setPhase(e?.status === 403 ? "denied" : "login");
    }
  }, []);

  useEffect(() => {
    if (auth.currentUser) verifyAdmin();
    else setPhase("login");
  }, [verifyAdmin]);

  const loadTab = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      const [ov, data] = await Promise.all([
        adminApi.overview(),
        t === "verifications" ? adminApi.verifications() : t === "listings" ? adminApi.listings("pending") : adminApi.bugs(),
      ]);
      setOverview(ov);
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (phase === "dash") loadTab(tab);
  }, [phase, tab, loadTab]);

  const doLogin = async () => {
    setErr("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await verifyAdmin();
    } catch (e: any) {
      const code = e?.code ?? "";
      const msg =
        code === "auth/invalid-email"
          ? "That email does not look right"
          : code === "auth/user-not-found"
            ? "No account found with this email"
            : code === "auth/wrong-password" || code === "auth/invalid-credential"
              ? "Incorrect email or password"
              : code === "auth/too-many-requests"
                ? "Too many attempts. Try again later"
                : "Could not sign in. Please try again";
      setErr(msg);
    }
    setBusy(false);
  };

  const doGoogle = async () => {
    setErr("");
    setBusy(true);
    try {
      await googleSignIn();
      await verifyAdmin();
    } catch (e: any) {
      setErr(googleErrorMessage(e));
    }
    setBusy(false);
  };

  // Was `catch {}`. An approve or reject that failed left the row exactly as
  // it was and said nothing, so an admin could believe they had verified a
  // seller when the call had 401'd or timed out. This is a verification write
  // path, so the failure is now shown.
  const act = async (id: string, action: "approve" | "reject") => {
    setErr("");
    try {
      if (tab === "verifications") await adminApi.actVerification(id, action);
      else if (tab === "listings") await adminApi.actListing(id, action);
      loadTab(tab);
    } catch (e: any) {
      const status = e?.status;
      setErr(
        status === 401
          ? "Your admin session expired. Sign out and sign in again."
          : status === 403
            ? "This account is not an admin."
            : status === 404
              ? "That item no longer exists. Refreshing."
              : `Could not ${action} this item. Nothing was changed.`,
      );
      if (status === 404) loadTab(tab);
    }
  };

  // ---- Login ----
  if (phase === "checking") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (phase === "login" || phase === "denied") {
    return (
      <View style={[styles.loginWrap, { paddingTop: insets.top + 40 }]}>
        <View style={styles.card}>
          <View style={styles.mark}>
            <T weight={900} size={22} color="#fff">
              A
            </T>
          </View>
          <T weight={700} size={22} ls={-1} style={{ marginTop: 14 }}>
            AASTHI Admin
          </T>
          <T weight={500} size={13} color={colors.muted} style={{ marginTop: 6, marginBottom: 18, textAlign: "center" }}>
            {phase === "denied" ? "This account isn't an admin. Sign in with an admin email." : "Sign in to review verifications and listings."}
          </T>
          <View style={{ width: "100%", gap: 12 }}>
            <Field value={email} onChangeText={setEmail} placeholder="Admin email" keyboardType="email-address" testID="admin-email" />
            <Field value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry testID="admin-password" />
            {err ? (
              <T weight={600} size={12} color={colors.red}>
                {err}
              </T>
            ) : null}
            <Button label={busy ? "Signing in…" : "Sign in"} onPress={doLogin} testID="admin-signin" />
            <View style={styles.divider}>
              <View style={styles.line} />
              <T weight={700} size={11} color={colors.faint}>
                OR
              </T>
              <View style={styles.line} />
            </View>
            <Pressable style={styles.google} onPress={doGoogle} testID="admin-google">
              <Icon name="globe" size={18} color={colors.ink} />
              <T weight={900} size={14}>
                Continue with Google
              </T>
            </Pressable>
            {phase === "denied" ? (
              <Button label="Sign out" variant="light" onPress={() => signOutUser().then(() => setPhase("login"))} testID="admin-signout-denied" />
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  // ---- Dashboard ----
  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "verifications", label: "Verifications", count: overview.pendingVerifications },
    { key: "listings", label: "Listings", count: overview.pendingListings },
    { key: "bugs", label: "Bug reports", count: overview.bugReports },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.warm }}>
      <View style={[styles.topbar, { paddingTop: insets.top + 14 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={styles.markSm}>
            <T weight={900} size={14} color="#fff">
              A
            </T>
          </View>
          <T weight={700} size={18} ls={-0.6}>
            AASTHI Admin
          </T>
        </View>
        <Pressable onPress={() => signOutUser().then(() => setPhase("login"))} style={styles.signout} testID="admin-signout">
          <Icon name="logout" size={16} color={colors.ink} />
          <T weight={700} size={12}>
            Sign out
          </T>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, maxWidth: 760, width: "100%", alignSelf: "center" }}
      >
        <View style={styles.tabs}>
          {TABS.map((t) => {
            const on = t.key === tab;
            return (
              <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, on && styles.tabOn]} testID={`admin-tab-${t.key}`}>
                <T weight={700} size={13} color={on ? "#fff" : colors.ink}>
                  {t.label}
                </T>
                {typeof t.count === "number" ? (
                  <View style={[styles.badge, on && { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                    <T weight={900} size={11} color={on ? "#fff" : colors.ink}>
                      {t.count}
                    </T>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Dashboard-side error banner. `err` used to be rendered only on the
            login card, so a failed approve/reject had nowhere to appear. */}
        {err ? (
          <View style={styles.dashError} testID="admin-error">
            <T weight={700} size={12.5} color={colors.red}>
              {err}
            </T>
          </View>
        ) : null}

        {loading ? (
          <View style={{ paddingVertical: 40 }}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <T weight={700} size={15} color={colors.muted}>
              Nothing pending here.
            </T>
          </View>
        ) : (
          <View style={{ gap: 12, marginTop: 14 }}>
            {items.map((it) => (
              <View key={it.id} style={styles.row} testID={`admin-item-${it.id}`}>
                {tab === "verifications" ? (
                  <>
                    <T weight={700} size={15}>
                      {it.sellerName ?? "Seller"}
                    </T>
                    <T weight={500} size={12} color={colors.muted} style={{ marginTop: 3 }}>
                      Govt ID + ownership proof · {it.status}
                    </T>
                    {/* The documents themselves. The row used to show only
                        the words above, so an admin was approving or
                        rejecting without ever seeing what was submitted.
                        These are getDownloadURL links carrying their own
                        access token, so storage.rules denying client reads on
                        verifications/** does not block them. */}
                    <View style={styles.docRow}>
                      {[
                        { label: "Government ID", uri: it.idDocUrl },
                        { label: "Ownership proof", uri: it.ownershipDocUrl },
                      ].map((doc) => (
                        <View key={doc.label} style={{ flex: 1 }}>
                          <T weight={900} size={9} color={colors.faint} ls={0.5} style={styles.docLabel}>
                            {doc.label}
                          </T>
                          {doc.uri ? (
                            <Pressable
                              onPress={() => Linking.openURL(doc.uri)}
                              testID={`admin-doc-${it.id}-${doc.label}`}
                            >
                              <Image source={{ uri: doc.uri }} style={styles.doc} contentFit="cover" />
                            </Pressable>
                          ) : (
                            <View style={[styles.doc, styles.docMissing]}>
                              <T weight={700} size={11} color={colors.red}>
                                Not uploaded
                              </T>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </>
                ) : tab === "listings" ? (
                  <>
                    <T weight={700} size={15} numberOfLines={1}>
                      {it.title ?? "Listing"}
                    </T>
                    <T weight={500} size={12} color={colors.muted} style={{ marginTop: 3 }}>
                      {it.price} · {it.addr}
                    </T>
                  </>
                ) : (
                  <>
                    <T weight={700} size={15}>
                      {it.ticket ?? "Bug"} · {it.category}
                    </T>
                    <T weight={500} size={12} color={colors.muted} style={{ marginTop: 4, lineHeight: 18 }}>
                      {it.desc || "No description"}
                    </T>
                  </>
                )}

                {tab !== "bugs" ? (
                  <View style={styles.actions}>
                    <Pressable style={[styles.act, { backgroundColor: colors.green }]} onPress={() => act(it.id, "approve")} testID={`admin-approve-${it.id}`}>
                      <T weight={900} size={12} color="#fff">
                        Approve
                      </T>
                    </Pressable>
                    <Pressable style={[styles.act, { backgroundColor: colors.soft }]} onPress={() => act(it.id, "reject")} testID={`admin-reject-${it.id}`}>
                      <T weight={900} size={12} color={colors.red}>
                        Reject
                      </T>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dashError: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(180,18,24,0.25)",
    backgroundColor: "rgba(180,18,24,0.06)",
    padding: 12,
  },
  docRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  docLabel: { textTransform: "uppercase", marginBottom: 5 },
  doc: {
    width: "100%",
    height: 130,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  docMissing: { alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.screen },
  loginWrap: { flex: 1, backgroundColor: colors.warm, alignItems: "center", paddingHorizontal: 20 },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
    alignItems: "center",
    ...shadow.soft,
  },
  mark: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.black, alignItems: "center", justifyContent: "center" },
  markSm: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.black, alignItems: "center", justifyContent: "center" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  google: {
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  signout: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.soft, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  tabs: { flexDirection: "row", gap: 8, marginTop: 4 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  tabOn: { backgroundColor: colors.black, borderColor: colors.black },
  badge: { minWidth: 20, paddingHorizontal: 6, height: 20, borderRadius: 999, backgroundColor: colors.soft, alignItems: "center", justifyContent: "center" },
  empty: { marginTop: 30, alignItems: "center", paddingVertical: 30 },
  row: { backgroundColor: "#fff", borderRadius: 22, borderWidth: 1, borderColor: colors.line, padding: 16, ...shadow.soft },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  act: { flex: 1, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
