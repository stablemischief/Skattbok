import type { Clan, Rune, PaymentMethod } from "./types";

export const DEFAULT_CLANS: Clan[] = [
  { id: "clan-stable-mischief", name: "Stable Mischief" },
  { id: "clan-sprout-spindle", name: "Sprout & Spindle" },
  { id: "clan-personal", name: "Personal" },
];

export const DEFAULT_RUNES: Rune[] = [
  { id: "rune-office-supplies", name: "Office & Supplies" },
  { id: "rune-software-subscriptions", name: "Software & Subscriptions" },
  { id: "rune-travel-transportation", name: "Travel & Transportation" },
  { id: "rune-meals-entertainment", name: "Meals & Entertainment" },
  { id: "rune-equipment-tools", name: "Equipment & Tools" },
  { id: "rune-farm-agriculture", name: "Farm & Agriculture" },
  { id: "rune-marketing-advertising", name: "Marketing & Advertising" },
  { id: "rune-professional-services", name: "Professional Services" },
  { id: "rune-utilities", name: "Utilities" },
  { id: "rune-other", name: "Other" },
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "pm-cash", type: "cash", nickname: "Cash" },
  { id: "pm-other", type: "other", nickname: "Other" },
];

export const PROTECTED_PAYMENT_METHOD_IDS = ["pm-cash", "pm-other"];

export const APP_NAME = "Skattbók";
export const APP_DESCRIPTION = "Norse expense tracker — Record the Spoils";

export const THEME = {
  bg: "#0f0f0f",
  card: "#1a1a1a",
  gold: "#d4a017",
  text: "#f5e6c8",
  textMuted: "#a89274",
  border: "#2a2a2a",
  danger: "#c0392b",
  success: "#27ae60",
} as const;

export const GOOGLE_SHEETS_HEADERS = [
  "ID",
  "Date",
  "Vendor",
  "Description",
  "Category",
  "Amount",
  "Tax",
  "Total",
  "Payment Method",
  "Card Nickname",
  "Notes",
  "Image URL",
  "Created At",
] as const;

export const GOOGLE_DRIVE_ROOT_FOLDER = "Expense-App";
