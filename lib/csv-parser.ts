import Papa from "papaparse";
import { PaperData, ParsedSheetData, PricingRange, PrintSize } from "./types";

// Helper: Converts "1-50" to { min: 1, max: 50 }
const parseRangeHeader = (header: string): { min: number; max: number } | null => {
  if (!header) return null;
  const clean = header.replace(/\s/g, "").toLowerCase();

  // Handle "10000+"
  if (clean.includes("+")) {
    const min = parseInt(clean.replace("+", ""));
    return { min, max: Number.MAX_SAFE_INTEGER };
  }

  // Handle "1-50", "26to50", or just "50"
  const parts = clean.includes("to") ? clean.split("to") : clean.split("-");
  
  if (parts.length === 2) {
    const min = parseInt(parts[0]);
    const max = parseInt(parts[1]);
    if (!isNaN(min) && !isNaN(max)) return { min, max };
  }

  return null;
};

export const parseCostingSheet = (csvString: string, selectedSize: PrintSize): ParsedSheetData => {
  // 1. Parse Raw CSV
  const result = Papa.parse(csvString, { header: false, skipEmptyLines: false }); 
  const rows = result.data as string[][];

  console.log(`[Parser] Raw rows found: ${rows.length}`);

  // 2. FIND KEY ROWS DYNAMICALLY
  // Don't assume row numbers but instead look for keywords.
  
  // Find the row that defines "A4 Size", "A3 Size"
  const sizeRowIndex = rows.findIndex(row => 
    row.some(cell => (cell || "").toString().toLowerCase().includes("a4 size"))
  );

  // Find the row that has the headers "Paper Name" and "1-50"
  const headerRowIndex = rows.findIndex(row => 
    row.some(cell => (cell || "").toString().toLowerCase().includes("paper name"))
  );

  if (sizeRowIndex === -1 || headerRowIndex === -1) {
    console.error("[Parser] Critical Error: Could not find 'A4 size' or 'PAPER NAME' rows.");
    return { ranges: [], papers: [] };
  }

  console.log(`[Parser] Found 'Size Definition' at Row ${sizeRowIndex}`);
  console.log(`[Parser] Found 'Headers' at Row ${headerRowIndex}`);

  const topRow = rows[sizeRowIndex];    // The row with "A4 size"
  const rangeRow = rows[headerRowIndex]; // The row with "1-50"

  // 3. IDENTIFY COLUMN BLOCK FOR SELECTED SIZE
  // Scan 'Size Row' to find where the selected size starts and ends
  let startIndex = -1;
  let endIndex = -1;
  const searchStr = selectedSize.toLowerCase() + " size";

  for (let i = 0; i < topRow.length; i++) {
    const cell = (topRow[i] || "").toLowerCase();
    
    if (cell.includes(searchStr)) {
      startIndex = i;
      // Look ahead for the next size block to determine the end
      for (let j = i + 1; j < topRow.length; j++) {
        const nextCell = (topRow[j] || "").toLowerCase();
        if (nextCell.includes("size") && (nextCell.includes("a3") || nextCell.includes("a4") || nextCell.includes("a5"))) {
          endIndex = j;
          break;
        }
      }
      if (endIndex === -1) endIndex = topRow.length;
      break;
    }
  }

  // Fallback if dynamic block detection fails
  if (startIndex === -1) {
    console.warn(`[Parser] Warning: Could not find '${selectedSize} size' block. Using defaults.`);
    if (selectedSize === 'A4') { startIndex = 19; endIndex = 36; } 
    if (selectedSize === 'A3') { startIndex = 37; endIndex = 53; }
    if (selectedSize === 'A5') { startIndex = 55; endIndex = 71; }
  }

  console.log(`[Parser] Scanning columns ${startIndex} to ${endIndex} for ranges...`);

  // 4. MAP HEADERS TO RANGES
  const ranges: PricingRange[] = [];
  
  for (let i = startIndex; i < endIndex; i++) {
    const header = rangeRow[i];
    const parsed = parseRangeHeader(header);
    
    if (parsed) {
      ranges.push({
        min: parsed.min,
        max: parsed.max,
        colIndex: i,
        label: header
      });
    }
  }
  
  console.log(`[Parser] Found ${ranges.length} valid price ranges.`);

  // 5. PARSE DATA ROWS (Starting immediately after the header row)
  const papers: PaperData[] = [];
  
  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    // "Paper Name" is usually in the 3rd column (Index 2) from Mr. Manek's spreadsheet
    const paperName = row[2]; 

    if (!paperName || paperName.trim() === "") continue;

    const prices: Record<string, number> = {};
    let hasValidPrice = false;

    ranges.forEach(range => {
      // Clean up price string (handle "AED 5.00" or "5.00")
      const rawPrice = (row[range.colIndex] || "").toString().replace(/[^0-9.]/g, "");
      const price = parseFloat(rawPrice);
      
      if (!isNaN(price) && price > 0) {
        prices[range.label] = price;
        hasValidPrice = true;
      }
    });

    if (hasValidPrice) {
      papers.push({ name: paperName, prices });
    }
  }

  console.log(`[Parser] Successfully parsed ${papers.length} papers.`);
  return { ranges, papers };
};

export const parseFinishingSheet = (csvString: string) => {
  const result = Papa.parse(csvString, { header: false, skipEmptyLines: false });
  const rows = result.data as string[][];

  const items: PaperData[] = [];
  
  // State: This tracks the headers for the "Current Section" being read
  let currentSectionRanges: PricingRange[] = [];
  let nameColIndex = -1;
  let currentCategory = "General"; // Default category

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];

    // 1. HEADER DETECTION
    // If "1-10" is found, it's a new section (Lamination OR Binding) is starting.
    const isHeader = row.some(cell => {
      const c = (cell || "").toString().toLowerCase().replace(/\s/g, "");
      return c.includes("1-10") || c.includes("1to10");
    });

    if (isHeader) {
      console.log(`[Parser] Found Section Header at Row ${r}`);
      currentSectionRanges = []; // RESET ranges for this new section
      nameColIndex = -1;
      currentCategory = "Other"; // Reset category

      for (let i = 0; i < row.length; i++) {
        const cell = (row[i] || "").trim();
        
        // Detect Name Column (looks for text like "Lamination" or "Binding" or "Item")
        // If it finds a match, it sets the index.
        if (
          cell.toLowerCase().includes("lamination") || 
          cell.toLowerCase().includes("binding") || 
          cell.toLowerCase().includes("sewing") || 
          cell.toLowerCase().includes("item")) {
          nameColIndex = i;

          // Clean up the category name (e.g. "Lamination Costing" -> "Lamination")
          currentCategory = cell.replace(/costing/i, "").trim();

          // Ensure first letter is capitalized
          currentCategory = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);

        }

        // Parse Range Header
        const parsed = parseRangeHeader(cell);
        if (parsed) {
          // Store this range for the current section
          currentSectionRanges.push({ ...parsed, colIndex: i, label: cell });
        }
      }
      
      if (nameColIndex === -1) nameColIndex = 5; // Fallback
      continue; // Done with header row, move to next
    }

    // 2. ITEM PARSING
    if (currentSectionRanges.length > 0) {
      // Use the nameColIndex we found in the header, or default to 5
      const actualNameIndex = nameColIndex > -1 ? nameColIndex : 5;
      const name = row[actualNameIndex];

      // Remove the check for 'includes("lamination")' so valid items aren't skipped.
      if (!name || name.trim() === "") continue;

      // Safety: Don't parse the header row itself if it was repeated
      const nameLower = name.toLowerCase();
      if (nameLower.includes("lamination") && nameLower.includes("costing")) continue;

      const prices: Record<string, number> = {};
      let hasValidPrice = false;

      // Use the CURRENT SECTION'S ranges
      currentSectionRanges.forEach(range => {
        const rawPrice = (row[range.colIndex] || "").toString().replace(/[^0-9.]/g, "");
        const price = parseFloat(rawPrice);
        
        if (!isNaN(price) && price > 0) {
          prices[range.label] = price;
          hasValidPrice = true;
        }
      });

      if (hasValidPrice) {
        items.push({ 
          name: name.trim(), 
          category: currentCategory, // Assign the detected category
          prices,
          validRanges: [...currentSectionRanges] // Attach the correct table map to this item
        });
      }
    }
  }

  return { ranges: [], items };
};