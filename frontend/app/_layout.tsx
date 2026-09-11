import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AppProvider } from "@/src/store/AppContext";
import { ToastHost } from "@/src/components/ui";

// Disable logbox errors etc so that users can see the app.
LogBox.ignoreAllLogs(true);

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconsLoaded, iconError] = useIconFonts();
  const [interLoaded] = useFonts({
    "Inter-400": require("../assets/fonts/Inter-400.ttf"),
    "Inter-500": require("../assets/fonts/Inter-500.ttf"),
    "Inter-600": require("../assets/fonts/Inter-600.ttf"),
    "Inter-700": require("../assets/fonts/Inter-700.ttf"),
    "Inter-800": require("../assets/fonts/Inter-800.ttf"),
    "Inter-900": require("../assets/fonts/Inter-900.ttf"),
  });

  const ready = (iconsLoaded || iconError) && interLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#ffffff" },
            }}
          >
            {/* The inquiry sheet needs the screen BEHIND it to stay visible,
                so this one route opts out of the opaque white background and
                fades in over the property. transparentModal is an expo-router
                option — no native module, no blur. */}
            <Stack.Screen
              name="enquiry"
              options={{
                presentation: "transparentModal",
                animation: "fade",
                contentStyle: { backgroundColor: "transparent" },
              }}
            />
          </Stack>
          <ToastHost />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
