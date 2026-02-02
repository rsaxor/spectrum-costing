export type PrintSize = "A3" | "A4" | "A5";

export type PricingRange = {
  min: number;
  max: number;
  colIndex: number; // The exact column in the CSV where this price lives
  label: string;    // "1-50"
};

export type PaperData = {
  name: string;     // The Paper Name
  category?: string; // Stores "lamination / binding / section sewing / etc."
  prices: Record<string, number>; // Key is the range label, Value is the price
  validRanges?: PricingRange[];
};

export type ParsedSheetData = {
  ranges: PricingRange[];
  papers: PaperData[];
  items?: PaperData[]; // For finishing items
};