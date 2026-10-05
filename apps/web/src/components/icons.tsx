import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Shared base for the marketing site's line icons.
 * Stroke-based (1.75px) rather than emoji, so the UI reads as hand-crafted
 * instead of template-generated.
 */
function IconBase({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Brand mark: a pair of scissors (hairdresser / barber). */
export function ScissorsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88" />
      <path d="M14.47 14.48 20 20" />
      <path d="M8.12 8.12 12 12" />
    </IconBase>
  );
}

/** Mini-site / web page. */
export function BrowserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9h18" />
      <path d="M6.5 6.5h.01M9.5 6.5h.01" />
    </IconBase>
  );
}

/** Online booking / calendar. */
export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M8 14.5h3" />
    </IconBase>
  );
}

/** Reminders / messaging. */
export function ChatIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 8.6 8.6 0 0 1-3.4-.7L3 21l1.7-5A8.5 8.5 0 0 1 12 3a8.38 8.38 0 0 1 9 8.5Z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
    </IconBase>
  );
}

/** Mobile app. */
export function PhoneIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M11 18h2" />
    </IconBase>
  );
}

/** Checkmark (benefit lists, trust row). */
export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m4.5 12.5 4.5 4.5L19.5 6.5" />
    </IconBase>
  );
}

/** Small downward arrow (secondary CTA / anchors). */
export function ArrowDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5.5 12.5 12 19l6.5-6.5" />
    </IconBase>
  );
}
