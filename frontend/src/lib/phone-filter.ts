// Blocks a phone number from being typed into an inquiry thread.
//
// WHAT THIS IS FOR. Calling is allowed — the agent's Call button and the
// number reveal on /detail are untouched. What is not allowed is moving the
// conversation off AASTHI by pasting a number into chat. This is FRICTION,
// not enforcement: it runs on the sender's device, and a determined pair of
// people will beat it (see WILL NOT CATCH below). It stops the casual
// exchange, which is the whole ask.
//
// NOTHING IS EVER SILENTLY STRIPPED. The send is refused and the sender is
// told which fragment tripped it, so they can see the rule rather than
// wonder why their message vanished.

export type PhoneCheck = {
  blocked: boolean;
  // User-facing, shown in the composer. Empty when nothing was found.
  reason: string;
  // The fragment that tripped it, quoted back so the block is not a mystery.
  sample: string;
};

const OK = { blocked: false, reason: "", sample: "" };

// A run of this many digits reads as a phone number. Indian mobiles are 10;
// 7 also catches landlines and the "last 7 digits, you know the code" dodge.
const RUN = 7;

// Words that legitimately precede a long number in a property conversation.
// Without this an agent cannot type their own RERA id or a survey number,
// and a filter agents have to work around is a filter they stop using.
const ALLOWED_BEFORE = ["rera", "survey", "plot", "door", "khata", "flat"];

// How far back to look for one of those words. Long enough for "survey no."
// and "plot number", short enough that an unrelated word two sentences ago
// cannot unlock a number.
const CARVE_OUT_LOOKBACK = 24;

// Separators that do NOT break a number: "98765 43210", "987-654-3210",
// "+91 (0) 9876.543.210".
//
// THE COMMA IS DELIBERATELY NOT HERE. Indian prices are written with commas,
// and a comma-separated price is a run of exactly the length a phone number
// is: "86,00,000" is seven digits. Nobody writes a phone number with commas,
// and a filter that blocked every price typed in a property chat would be
// abandoned by lunchtime.
const SEPARATORS = " \t.-_/()+·:";

// A run that looks like a date is a date. "come on 11/08/2025" is eight
// digits and it is not a phone number. Tested against the RAW run, before
// separators are collapsed, so only real date shapes match.
const DATE_LIKE = /^\d{1,2}\s*[/.\-]\s*\d{1,2}\s*[/.\-]\s*\d{2,4}$/;

// Substitutions, applied ONLY when the previous character in the run was
// already a digit. That catches "9876S4321O" without turning "SOS" or
// "Hello" into digits.
const SUBSTITUTES: Record<string, string> = {
  O: "0", o: "0",
  I: "1", l: "1",
  S: "5", s: "5",
};

const WORD_DIGITS: Record<string, string> = {
  zero: "0", oh: "0", o: "0", nought: "0",
  one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
};

// Unicode digit blocks that reach this app: Devanagari and Telugu. Kurnool is
// a Telugu-speaking city, so ౯౮౭... is not a theoretical case.
function asciiDigit(ch: string): string | null {
  const c = ch.codePointAt(0) ?? 0;
  if (c >= 0x30 && c <= 0x39) return ch;                       // 0-9
  if (c >= 0x0966 && c <= 0x096f) return String(c - 0x0966);   // Devanagari
  if (c >= 0x0c66 && c <= 0x0c6f) return String(c - 0x0c66);   // Telugu
  if (c >= 0x0660 && c <= 0x0669) return String(c - 0x0660);   // Arabic-Indic
  return null;
}

function normalise(input: string): string {
  return input
    .normalize("NFKC")
    // Zero-width characters, the oldest trick for splitting a number.
    // Written as escapes on purpose: these are invisible in an editor and a
    // literal here would look like an empty character class.
    .replace(/[\u200B-\u200D\uFEFF\u2060]/g, "");
}

// True when one of the carve-out words sits just before `index`.
function carvedOut(text: string, index: number): boolean {
  const before = text.slice(Math.max(0, index - CARVE_OUT_LOOKBACK), index).toLowerCase();
  return ALLOWED_BEFORE.some((w) => before.includes(w));
}

// Pass 1: runs of digits, allowing separators and digit-adjacent letter
// substitutions inside a run.
function findDigitRun(text: string): { sample: string; index: number } | null {
  let digits = "";
  let start = -1;
  let raw = "";
  let lastWasDigit = false;

  const flush = () => {
    const trimmed = raw.trim();
    const hit =
      digits.length >= RUN && !carvedOut(text, start) && !DATE_LIKE.test(trimmed)
        ? { sample: trimmed, index: start }
        : null;
    digits = "";
    raw = "";
    start = -1;
    lastWasDigit = false;
    return hit;
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const d = asciiDigit(ch);

    if (d !== null) {
      if (start < 0) start = i;
      digits += d;
      raw += ch;
      lastWasDigit = true;
      continue;
    }

    if (lastWasDigit && SUBSTITUTES[ch] !== undefined) {
      digits += SUBSTITUTES[ch];
      raw += ch;
      continue;
    }

    if (start >= 0 && SEPARATORS.includes(ch)) {
      // A separator holds the run open but is not a digit itself.
      raw += ch;
      lastWasDigit = false;
      continue;
    }

    const hit = flush();
    if (hit) return hit;
  }
  return flush();
}

// Pass 2: numbers written out. "nine eight seven six five four three two one
// zero", and the Indian spoken shorthand "double nine", "triple eight".
function findWordRun(text: string): { sample: string; index: number } | null {
  const tokens = [...text.toLowerCase().matchAll(/[a-z]+/g)];
  let count = 0;
  let start = -1;
  let firstToken = -1;
  let multiplier = 1;

  for (let t = 0; t < tokens.length; t++) {
    const w = tokens[t][0];
    const at = tokens[t].index ?? 0;

    if (w === "double" || w === "triple") {
      multiplier = w === "double" ? 2 : 3;
      if (start < 0) {
        start = at;
        firstToken = t;
      }
      continue;
    }

    const d = WORD_DIGITS[w];
    if (d !== undefined) {
      if (start < 0) {
        start = at;
        firstToken = t;
      }
      count += multiplier;
      multiplier = 1;
      if (count >= RUN && !carvedOut(text, start)) {
        const end = at + w.length;
        return { sample: text.slice(tokens[firstToken].index ?? 0, end).trim(), index: start };
      }
      continue;
    }

    count = 0;
    start = -1;
    multiplier = 1;
  }
  return null;
}

/**
 * Returns { blocked: true } when `text` contains something that reads as a
 * phone number.
 *
 * CATCHES
 *   9876543210                     plain run
 *   98765 43210 / 987-654-3210     space, dash, dot, slash, brackets
 *   +91 98765 43210                country code
 *   ९८७६५४३२१० / ౯౮౭౬౫౪౩౨౧౦       Devanagari and Telugu digits
 *   9 8 7 6 5 4 3 2 1 0            single-spaced digits
 *   98765​43210                     zero-width split
 *   9876S4321O                     S->5, O->0, only next to digits
 *   nine eight seven six five four three
 *   double nine triple eight seven six
 *
 * DOES NOT CATCH, deliberately, and Raghu has accepted this:
 *   "my number is 98765" then "43210" in a SECOND message. A per-message
 *   check cannot see across messages. Friction, not enforcement.
 *   "ping me on WhatsApp", "same as my Truecaller" — no digits at all.
 *   Hindi or Telugu number WORDS ("nau aath saat"). English word list only.
 *   A number written inside a photo. There are no image messages.
 *
 * DOES NOT BLOCK
 *   "RERA P02400001234", "survey no 123456789", "plot 87654321",
 *   "door 1234567", "khata 9876543", "flat 1234567" — the carve-out.
 */
export function checkForPhone(text: string): PhoneCheck {
  const n = normalise(text);
  const hit = findDigitRun(n) ?? findWordRun(n);
  if (!hit) return OK;
  return {
    blocked: true,
    sample: hit.sample,
    reason:
      "That looks like a phone number. Numbers are shared through Contact on the listing, not in chat.",
  };
}
