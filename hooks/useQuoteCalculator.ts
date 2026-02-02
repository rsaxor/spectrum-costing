import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseCostingSheet, parseFinishingSheet } from "@/lib/csv-parser";
import { PrintSize } from "@/lib/types";

const roundMoney = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export type LineItem = {
	id: string;
	type: "PAPER" | "FINISHING";
	label: string;
	name: string;
	qty: number;
	unitPrice: number;
	totalPrice: number;
	rangeLabel: string;
};

export const useQuoteCalculator = () => {
	// --- 1. GLOBAL STATE ---
	const [printSize, setPrintSize] = useState<PrintSize>("A4");
	const [jobQty, setJobQty] = useState<number>(100);
	const [lines, setLines] = useState<LineItem[]>([]);

	// --- 2. DATA FETCHING ---
	// Paper Data
	const { data: paperCsv } = useQuery({
		queryKey: ["paperData"],
		queryFn: async () => (await fetch("/api/prices")).text(),
	});

	// Finishing Data
	const { data: finishingCsv } = useQuery({
		queryKey: ["finishingData"],
		queryFn: async () => (await fetch("/api/finishing")).text(),
	});

	// --- 3. PARSING ---
	const parsedPaper = useMemo(() => {
		if (!paperCsv) return null;
		return parseCostingSheet(paperCsv, printSize);
	}, [paperCsv, printSize]);

	const parsedFinishing = useMemo(() => {
		if (!finishingCsv) return null;
		return parseFinishingSheet(finishingCsv);
	}, [finishingCsv]);

	// --- 4. CALCULATION ENGINE ---
	const calculatedLines = useMemo(() => {
		return lines.map((line) => {
			let unitPrice = 0;
			let rangeLabel = "Out of Range";
			let total = 0;

			// === LOGIC A: PAPER ===
			if (line.type === "PAPER" && parsedPaper) {
				// ... (Keep existing Paper Logic) ...
				const paper = parsedPaper.papers.find(
					(p) => p.name === line.name,
				);
				const totalVolume = line.qty * jobQty;

				// Paper uses global ranges
				const matchedRange = parsedPaper.ranges.find(
					(r) => totalVolume >= r.min && totalVolume <= r.max,
				);
				let effectiveRange = matchedRange;

				// Fallback for huge volume
				if (!effectiveRange && parsedPaper.ranges.length > 0) {
					const maxRange =
						parsedPaper.ranges[parsedPaper.ranges.length - 1];
					if (totalVolume > maxRange.max) effectiveRange = maxRange;
				}

				if (paper && effectiveRange) {
                    rangeLabel = effectiveRange.label;
                    
                    // --- Add "+" sign for Paper if exceeding max ---
                    if (totalVolume > effectiveRange.max) {
                        // Only add if it's not already there (e.g. prevent "10000++")
                        if (!rangeLabel.includes('+')) {
                            rangeLabel = `${effectiveRange.max}+`;
                        }
                    }
                    
                    unitPrice = paper.prices[effectiveRange.label] || 0;
                }
				total = roundMoney(totalVolume * unitPrice);
			}

			if (line.type === 'FINISHING' && parsedFinishing) {
				const item = parsedFinishing.items?.find(i => i.name === line.name);
				const isCompatible = item?.name.toLowerCase().includes(printSize.toLowerCase());

				if (item && isCompatible && item.validRanges && item.validRanges.length > 0) {
				
				const category = (item.category || "").toLowerCase();
				const isLamination = category.includes("lamination");
				const isSectionSewing = category.includes("sewing");

				// 1. DETERMINE LOOKUP VOLUME
				// Lamination checks "Total Sheets" (Qty * Job).
				// Others check just "Job Qty".
				const lookupVolume = isLamination ? (line.qty * jobQty) : jobQty;

				rangeLabel = 'Out of Range';
				
				// 2. FIND RANGE (Using correct lookup volume)
				const matchedRange = item.validRanges.find(
					r => lookupVolume >= r.min && lookupVolume <= r.max
				);

				let effectiveRange = matchedRange;

				// Fallback logic
				if (!effectiveRange) {
					const maxRange = item.validRanges[item.validRanges.length - 1];
					if (lookupVolume > maxRange.max) {
						effectiveRange = maxRange;
					}
				}

				if (effectiveRange) {
					rangeLabel = effectiveRange.label;
					// Add "+" sign
					if (lookupVolume > effectiveRange.max && !rangeLabel.includes('+')) {
					rangeLabel = `${effectiveRange.max}+`;
					}
					
					// Get the raw value from the sheet
					const sheetValue = item.prices[effectiveRange.label] || 0;

					// 3. CALCULATE TOTAL BASED ON CATEGORY
					if (isSectionSewing) {
						// TYPE A: FLAT FEE (Fixed Price)
						// The value in the sheet IS the line total. Do not multiply.
						unitPrice = sheetValue; // Display the flat fee as unit price for reference
						total = sheetValue;
					} else if (isLamination) {
						// TYPE B: LAMINATION (Volume based)
						// Value is Cost Per Sheet. Total = Cost * LineQty * JobQty
						unitPrice = sheetValue;
						total = unitPrice * line.qty * jobQty;
					} else {
						// TYPE C: BINDING / STANDARD (Set based)
						// Value is Cost Per Set. Total = Cost * LineQty (usually 1) * JobQty
						unitPrice = sheetValue;
						total = unitPrice * line.qty * jobQty;
					}
				}
				}
				total = roundMoney(total);
			}

            return {
                ...line,
                unitPrice,
                rangeLabel,
                totalPrice: total
            };
        });
    }, [lines, parsedPaper, parsedFinishing, jobQty, printSize]); // Added printSize dependency

	const grandTotal = calculatedLines.reduce(
		(acc, curr) => acc + curr.totalPrice,
		0,
	);

	// --- FILTERED OPTIONS ---
	// Only show Finishing options that match the selected size (e.g. "A4")
	const filteredFinishingOptions = useMemo(() => {
		if (!parsedFinishing) return [];
		return parsedFinishing.items.filter((item) =>
			// Case insensitive check if item name contains "A4", "A3", etc.
			item.name.toLowerCase().includes(printSize.toLowerCase()),
		);
	}, [parsedFinishing, printSize]);

	// --- ACTIONS ---

	// Helper to determine if a line should be locked to Qty 1
	const isFixedQty = (line: LineItem): boolean => {
		if (line.type !== 'FINISHING') return false;
		
		// Find the item details
		const item = parsedFinishing?.items.find(i => i.name === line.name);
		if (!item?.category) return false;

		// Check category keywords
		const cat = item.category.toLowerCase();
		return cat.includes('binding') || cat.includes('sewing');
	};

	const addLine = (type: "PAPER" | "FINISHING") => {
		setLines((prev) => [
			...prev,
			{
				id: Math.random().toString(36).substring(2, 9),
				type,
				label: "",
				name: "",
				qty: 1, // Default qty 1
				unitPrice: 0,
				totalPrice: 0,
				rangeLabel: "-",
			},
		]);
	};

	const removeLine = (id: string) => {
		setLines((prev) => prev.filter((l) => l.id !== id));
	};

	const updateLine = <K extends keyof LineItem>(id: string, field: K, value: LineItem[K]) => {
		setLines(prev => prev.map(l => {
		if (l.id !== id) return l;

		const updatedLine = { ...l, [field]: value };

		// SIDE EFFECT: When NAME changes (User selects a dropdown option)
		if (field === 'name' && l.type === 'FINISHING') {
			const selectedItem = parsedFinishing?.items.find(i => i.name === value);
			
			if (selectedItem?.category) {
			// 1. Auto-Populate Label with Category
			updatedLine.label = selectedItem.category;

			// 2. Fixed Qty Logic
			const cat = selectedItem.category.toLowerCase();
			if (cat.includes('binding') || cat.includes('sewing')) {
				updatedLine.qty = 1;
			}
			// Note: We don't reset Lamination qty because user might want 2 (Front/Back)
			}
		}

		return updatedLine;
		}));
	};

	return {
		printSize,
		jobQty,
		lines: calculatedLines,
		grandTotal,
		paperOptions: parsedPaper?.papers || [],
		finishingOptions: filteredFinishingOptions, // Return filtered list
		isLoading: !paperCsv, // Simple loading check
		error: null,
		setPrintSize,
		setJobQty,
		addLine,
		removeLine,
		updateLine,
		isFixedQty,
	};
};
