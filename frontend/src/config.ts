// Feature flags for launch. Set back to true when these are ready to ship —
// the screens/logic behind them are untouched, only their entry points are
// hidden while the app launches fully free (no working payment flow yet).
export const FEATURES = {
  premium: false,
  tour360: false,
  // Language/currency/dark-mode and push/email notification preferences all
  // persist correctly to Firestore, but nothing in the app reads them back
  // yet (no theme provider, no i18n, no notification gating). Hidden until
  // that's actually built, rather than shipping settings that silently do
  // nothing.
  personalization: false,
  notificationPrefs: false,
};
