/**
 * Ambient module declarations and next-intl message typing.
 */
import type { Messages } from "@bookedforreal/i18n";

declare module "tailwindcss-animate";

declare global {
  // Full typing for next-intl `t()` keys (source of truth: packages/i18n/messages).
  interface IntlMessages extends Messages {}
}
