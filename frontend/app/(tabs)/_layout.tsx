import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { T } from "@/src/components/ui";
import { Icon, IconName } from "@/src/icons";
import { colors, shadow } from "@/src/theme";

// Real tab routes only. "saved" is deliberately still a Tabs.Screen below —
// it lost its slot in the bar, NOT its route. It is reached from the Saved
// quick action on /profile, and every heart control still writes to it.
const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: "index", label: "Home", icon: "home" },
  { name: "search", label: "Search", icon: "search" },
  { name: "profile", label: "Profile", icon: "user" },
];

function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const routeIndex = (n: string) => state.routes.findIndex((r) => r.name === n);
  const isActive = (n: string) => state.index === routeIndex(n);

  const go = (n: string) => {
    const route = state.routes[routeIndex(n)];
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!isActive(n) && !event.defaultPrevented) {
      navigation.navigate(n);
    }
  };

  const Item = ({ tab }: { tab: (typeof TABS)[number] }) => {
    const active = isActive(tab.name);
    return (
      <Pressable
        style={[styles.item, active && styles.itemActive]}
        onPress={() => go(tab.name)}
        testID={`tab-${tab.label.toLowerCase()}`}
      >
        <Icon name={tab.icon} size={19} color={active ? colors.ink : "#7e7e7e"} filled={tab.icon === "heart" && active} />
        <T weight={850} size={9.5} color={active ? colors.ink : "#7e7e7e"} style={{ marginTop: 3 }}>
          {tab.label}
        </T>
      </Pressable>
    );
  };

  // /my-enquiries lives in the stack, not in this tab group, so its slot is a
  // push — the same shape the List button already uses. It therefore never
  // shows the active pill, because the tab navigator has no state for it.
  const PushItem = ({
    icon,
    label,
    href,
    testID,
  }: {
    icon: IconName;
    label: string;
    href: string;
    testID: string;
  }) => (
    <Pressable style={styles.item} onPress={() => router.push(href as any)} testID={testID}>
      <Icon name={icon} size={19} color="#7e7e7e" />
      <T weight={850} size={9.5} color="#7e7e7e" style={{ marginTop: 3 }}>
        {label}
      </T>
    </Pressable>
  );

  return (
    <View style={[styles.nav, { paddingBottom: 8 + insets.bottom }]}>
      <Item tab={TABS[0]} />
      <Item tab={TABS[1]} />
      <Pressable style={styles.post} onPress={() => router.push("/sell")} testID="tab-list">
        <View style={styles.postCircle}>
          <Icon name="plus" size={21} color={colors.white} />
        </View>
        <T weight={850} size={9.5} color="#7e7e7e" style={{ marginTop: 1 }}>
          List
        </T>
      </Pressable>
      {/* Was Saved. Labelled "Enquiries", not "Chat": there are no threads
          here, only a record of contact. */}
      <PushItem icon="inbox" label="Enquiries" href="/my-enquiries" testID="tab-enquiries" />
      <Item tab={TABS[2]} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: undefined,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    flexDirection: "row",
    paddingTop: 6,
    paddingHorizontal: 10,
    ...shadow.strong,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 6,
  },
  itemActive: { backgroundColor: "#f2f2ef" },
  post: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  postCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -5 }],
    ...shadow.soft,
  },
});
