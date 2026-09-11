import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, T } from "@/src/components/ui";
import { colors } from "@/src/theme";
import { useApp } from "@/src/store/AppContext";
import { googleErrorMessage } from "@/src/services/authProviders";

const HERO =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=90";

type AuthMode = "signin" | "signup";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    login,
    signup,
    loginWithGoogle,
    showToast,
  } = useApp();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submitEmail = async (nextMode = mode) => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      showToast("Enter email and password to continue");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const action = nextMode === "signin" ? login : signup;
      const { needsSetup } = await action(cleanEmail, password);
      if (needsSetup) router.replace("/auth/profile-setup");
      else router.replace("/(tabs)");
    } catch (e: any) {
      const code = e?.code ?? "";
      const msg =
        code === "auth/invalid-email"
          ? "That email does not look right"
          : code === "auth/user-not-found"
            ? "No account found. Create an account first"
            : code === "auth/email-already-in-use"
              ? "Account already exists. Use Sign in"
              : code === "auth/wrong-password" || code === "auth/invalid-credential"
                ? "Incorrect email or password"
                : code === "auth/weak-password"
                  ? "Password must be at least 6 characters"
                  : "Could not continue. Please try again";
      showToast(msg);
      setBusy(false);
    }
  };

  const submitGoogle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { needsSetup } = await loginWithGoogle();
      if (needsSetup) router.replace("/auth/profile-setup");
      else router.replace("/(tabs)");
    } catch (e: any) {
      showToast(googleErrorMessage(e?.code));
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <View style={styles.hero}>
        <Image source={{ uri: HERO }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.75)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.heroContent, { paddingTop: insets.top + 20 }]}>
          <View style={styles.mark}>
            <T weight={700} size={17} color={colors.black}>
              A
            </T>
          </View>
          <T weight={700} size={10.5} color="#fff" ls={3} style={{ marginTop: 8 }}>
            AASTHI
          </T>
          <T weight={700} size={26} color="#fff" ls={-0.5} style={{ marginTop: "auto", maxWidth: 300 }}>
            Property, made clear.
          </T>
          <T weight={500} size={11.5} color="rgba(255,255,255,0.82)" style={{ marginTop: 5, lineHeight: 16 }}>
            Verified listings, real photos and honest pricing across Kurnool.
          </T>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheet}
        >
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeButton, mode === "signin" && styles.modeButtonOn]}
              onPress={() => setMode("signin")}
              testID="mode-signin"
            >
              <T weight={700} size={12} color={mode === "signin" ? colors.white : colors.ink}>
                Sign in
              </T>
            </Pressable>
            <Pressable
              style={[styles.modeButton, mode === "signup" && styles.modeButtonOn]}
              onPress={() => setMode("signup")}
              testID="mode-signup"
            >
              <T weight={700} size={12} color={mode === "signup" ? colors.white : colors.ink}>
                Create account
              </T>
            </Pressable>
          </View>

          <T weight={700} size={18} ls={-0.4}>
            {mode === "signin" ? "Welcome back" : "Create your AASTHI account"}
          </T>
          <T weight={500} size={11.5} color={colors.muted} style={{ marginTop: 3, marginBottom: 10 }}>
            {mode === "signin"
              ? "Use your registered email and password."
              : "Use a new email and password to sign up."}
          </T>

          <View style={{ gap: 8 }}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={colors.faint}
              keyboardType="email-address"
              autoCapitalize="none"
              testID="login-email"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.faint}
              secureTextEntry
              autoCapitalize="none"
              testID="login-password"
            />
            <Button
              label={
                busy
                  ? "Please wait..."
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"
              }
              onPress={() => submitEmail()}
              style={styles.primaryButton}
              testID="login-continue"
            />
          </View>

          <Pressable
            style={styles.switchLink}
            onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
            testID="auth-mode-switch"
          >
            <T weight={700} size={12}>
              {mode === "signin"
                ? "New to AASTHI? Create account"
                : "Already have an account? Sign in"}
            </T>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.line} />
            <T weight={700} size={10} color={colors.faint}>
              OR
            </T>
            <View style={styles.line} />
          </View>

          <View style={{ gap: 8 }}>
            <Pressable style={styles.social} onPress={submitGoogle} testID="login-google">
              <View style={styles.googleLogo}>
                <T weight={700} size={16} color="#4285F4" ls={0}>
                  G
                </T>
              </View>
              <T weight={700} size={13}>
                Continue with Google
              </T>
            </Pressable>
          </View>

          <T weight={500} size={10.5} color={colors.faint} style={{ textAlign: "center", marginTop: 10, lineHeight: 15 }}>
            By continuing you agree to AASTHI's Terms & Privacy.
          </T>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 185 },
  heroContent: { flex: 1, paddingHorizontal: 20, paddingBottom: 15 },
  mark: {
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  modeRow: {
    height: 36,
    borderRadius: 13,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    padding: 3,
    marginBottom: 10,
  },
  modeButton: {
    flex: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonOn: {
    backgroundColor: colors.black,
  },
  input: {
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.fieldBg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 13,
    color: colors.ink,
    fontSize: 13.5,
    fontWeight: "800",
  },
  primaryButton: {
    height: 44,
    borderRadius: 14,
  },
  switchLink: {
    height: 27,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 8 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  social: {
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  googleLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
