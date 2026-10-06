/** Default country used when a local number carries no international prefix. */
const DEFAULT_COUNTRY_CODE = "33";

/**
 * Normalises a phone number to E.164 (`+33612345678`), the only format Twilio
 * accepts for SMS and WhatsApp.
 *
 * Returns `null` when the input cannot be interpreted, so callers skip the
 * notification instead of spending a credit on a broken number.
 */
export function normalizePhone(
  input: string | null | undefined,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): string | null {
  if (!input) {
    return null;
  }

  // Drop the separators people type by hand: spaces, dots, dashes, slashes, parens.
  // What is left must be an optional leading `+` followed by digits only.
  const cleaned = input.replace(/[\s.\-()/]/g, "");
  if (!/^\+?\d+$/.test(cleaned)) {
    return null;
  }

  // Already international: +33612345678.
  if (cleaned.startsWith("+")) {
    return isPlausibleE164(cleaned) ? cleaned : null;
  }

  // International dialling prefix: 0033612345678.
  if (cleaned.startsWith("00")) {
    const international = `+${cleaned.slice(2)}`;
    return isPlausibleE164(international) ? international : null;
  }

  // Local trunk format: 0612345678 → +33612345678.
  if (cleaned.startsWith("0")) {
    if (cleaned.length !== 10) {
      return null;
    }
    const international = `+${countryCode}${cleaned.slice(1)}`;
    return isPlausibleE164(international) ? international : null;
  }

  // Local number typed without the trunk zero: 612345678.
  if (cleaned.length === 9) {
    const international = `+${countryCode}${cleaned}`;
    return isPlausibleE164(international) ? international : null;
  }

  // Country code typed without the plus: 33612345678.
  if (cleaned.startsWith(countryCode) && cleaned.length >= 11) {
    const international = `+${cleaned}`;
    return isPlausibleE164(international) ? international : null;
  }

  return null;
}

/** E.164 allows 8 to 15 digits including the country code. */
function isPlausibleE164(value: string): boolean {
  return /^\+\d{8,15}$/.test(value);
}
