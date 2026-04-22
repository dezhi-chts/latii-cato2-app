import { checkChanges } from "@/services/projectService";

export const extractBeforeAtSymbol = (input: string): string => {
  const atIndex = input.indexOf("@");
  return atIndex !== -1 ? input.slice(0, atIndex) : input;
};

export const getFullLocation = (settings: any) => {
  return [settings.state, settings.city, settings.postal_code, settings.address]
    .filter(Boolean)
    .join(", ");
};

export const sanitizeName = (label: string) => {
  if (!label) return "";
  return label.toLowerCase().replace(/\s+/g, "-");
};

export const sanitizeNameForFile = (label: string) => {
  if (!label) return "";
  return label.toLowerCase().replace(/\s+/g, "_");
};

export function mmToInchesWithFraction(mmValue: number | string): string {
  const mm = typeof mmValue === "string" ? parseFloat(mmValue) : mmValue;
  if (isNaN(mm)) return "-";

  const totalInches = mm / 25.4;
  const whole = Math.floor(totalInches);
  const decimal = totalInches - whole;

  const fractions = [
    { value: 0, label: "" },
    { value: 1 / 8, label: "1/8" },
    { value: 1 / 4, label: "1/4" },
    { value: 3 / 8, label: "3/8" },
    { value: 1 / 2, label: "1/2" },
    { value: 5 / 8, label: "5/8" },
    { value: 3 / 4, label: "3/4" },
    { value: 7 / 8, label: "7/8" },
  ];

  const closest = fractions.reduce((prev, curr) => {
    return Math.abs(curr.value - decimal) < Math.abs(prev.value - decimal)
      ? curr
      : prev;
  });

  const isAlmostNext = Math.abs(closest.value - 1) < 0.05;
  const finalWhole = isAlmostNext ? whole + 1 : whole;
  const fractionLabel = isAlmostNext ? "" : closest.label;

  return `${finalWhole}${fractionLabel ? " " + fractionLabel : ""}"`;
}

export function sanitizeKey(text: string): string {
  return text
    ?.replace(/-/g, "")
    .replace(/[ñÑ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function convertToCurrencyFormat(
  value: number | string,
  options?: {
    withSymbol?: boolean;
    noDecimals?: boolean;
  },
): string {
  const { withSymbol = true, noDecimals = false } = options || {};

  const number = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(number)) return withSymbol ? "$0" : "0";

  return number.toLocaleString("en-US", {
    style: withSymbol ? "currency" : "decimal",
    currency: "USD",
    minimumFractionDigits: noDecimals ? 0 : 2,
    maximumFractionDigits: noDecimals ? 0 : 2,
  });
}

export function formatPriceRange(
  range: string,
  options?: {
    withSymbol?: boolean;
    noDecimals?: boolean;
  },
): string {
  if (!range) return "";

  const [min, max] = range?.split("-").map(Number);

  if (isNaN(min) || isNaN(max)) return "";

  return `${convertToCurrencyFormat(min, options)} - ${convertToCurrencyFormat(
    max,
    options,
  )}`;
}

export function formatDateEnglish(dateString: string): string {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

export const getTextByOptionsValue = (section: any) => {
  const value = section?.selected_value;
  return section?.options?.find((o: any) => o.value === value)?.text || "-";
};

export const hasChanges = async (
  id: string,
): Promise<Record<string, boolean>> => {
  const response = await checkChanges(id);
  const rawData = response as any;

  const result: Record<string, boolean> = {};

  if (!rawData) return result;

  for (const [itemId, itemData] of Object.entries(rawData)) {
    const data = itemData as Record<string, boolean>;

    const hasTrueOtherThanIsRead = Object.entries(data).some(
      ([key, value]) => key !== "is_read" && value === true,
    );
    result[itemId] = hasTrueOtherThanIsRead && data.is_read === false;
  }
  return result;
};

export function getDaysAgoLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays}d`;
}

export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getFileName(
  name: string,
  nameToFileMap: Record<string, string>,
) {
  const lowerName = name.toLowerCase();

  const sortedKeys = Object.keys(nameToFileMap).sort(
    (a, b) => b.length - a.length,
  );

  for (const key of sortedKeys) {
    if (lowerName.includes(key.toLowerCase())) {
      return nameToFileMap[key];
    }
  }

  return null;
}

export function getDividerText(item: any, title: string): string {
  const key = title.toLowerCase();
  const arrangement = item?.[`${key}_dividers_arrangement`];

  const selectedValue = arrangement?.selected_value;
  const selectedText = arrangement?.options?.find(
    (opt: any) => opt.value === selectedValue,
  )?.text;

  if (!selectedText) return title === "SDL" ? "Flat - Flat 25mm" : "Thin";

  return selectedText;
}

export function base64ToFile(base64: string, filename: string): File {
  const [header, data] = base64.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = atob(data);
  const len = binary.length;
  const u8arr = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    u8arr[i] = binary.charCodeAt(i);
  }

  return new File([u8arr], filename, { type: mime });
}

export const getGreetingByTime = (date = new Date()): string => {
  const hour = date.getHours();

  if (hour >= 0 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 19) return "Good Afternoon";
  return "Good Night";
};

export const formatUserDate = (date = new Date(), locale = "en-US"): string => {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
};

export const getTitleFromPropertyName = (propertyName: string) => {
  const title = propertyName.replace(/_/g, " ");
  return title.charAt(0).toUpperCase() + title.slice(1);
};

export const getPropertyNameFromTitle = (title: string) => {
  const propertyName = title.replace(/ /g, "_");
  return propertyName.toLowerCase();
};

export const formatLabel = (value: unknown) => {
  const str = typeof value === "string" ? value : "";
  return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export const FIELD_TYPE_MAP = {
  0: "SHORT_TEXT",
  1: "LONG_TEXT",
  2: "NUMBERS",
  3: "SELECTOR",
  4: "CHECKS",
  5: "RADIO",
  6: "SWITCHES",
  7: "DATE",
  8: "LINK",
  9: "LOCATION",
} as const;

export type FieldTypeValue =
  (typeof FIELD_TYPE_MAP)[keyof typeof FIELD_TYPE_MAP];

export const getFieldType = (type: number): FieldTypeValue | undefined =>
  FIELD_TYPE_MAP[type as keyof typeof FIELD_TYPE_MAP];
type FieldOption = {
  label: string;
  value: string;
};

export const formatMetadataOptions = (metadata?: any[]): FieldOption[] => {
  try {
    if (!metadata?.length) return [];

    const parsed = JSON.parse(metadata[0]);

    if (!Array.isArray(parsed)) return [];

    return parsed.map((o) => ({
      label: String(o.label ?? ""),
      value: String(o.value ?? ""),
    }));
  } catch {
    return [];
  }
};

export const buildMetadataOptions = (options: FieldOption[]): string[] => {
  return [JSON.stringify(options)];
};

export const normalizeKey = (label: string) =>
  label.trim().toLowerCase().replaceAll(" ", "_");

export function formatDateLong(dateString: string): string {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
