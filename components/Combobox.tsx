"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ComboboxProps {
	options: { name: string; category?: string }[]; // Updated type
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
}

export const Combobox = ({
	options,
	value,
	onChange,
	placeholder = "Select option...",
	disabled = false,
}: ComboboxProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState(-1); // Tracks arrow/hover focus
	const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	// Sync internal input query with the parent's value only if different
	useEffect(() => {
		if (value !== query) {
			setQuery(value || "");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value]);

	// --- POSITIONING ---
	const updatePosition = () => {
		if (containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			setCoords({
				top: rect.bottom + window.scrollY + 4,
				left: rect.left + window.scrollX,
				width: rect.width,
			});
		}
	};

	const handleOpen = () => {
		if (!disabled) {
			updatePosition();
			setIsOpen(true);
			// When opening, scroll to the currently selected item
			const idx = options.findIndex((o) => o.name === value);
			setHighlightedIndex(idx >= 0 ? idx : 0);
		}
	};

	// --- AUTO-SCROLL LOGIC  ---
	useEffect(() => {
		if (isOpen && listRef.current && highlightedIndex >= 0) {
			// Find the actual <li> element, scroll to the [data-index] that matches
			const listItem = listRef.current.querySelector(`[data-index='${highlightedIndex}']`);
			if (listItem) {
				listItem.scrollIntoView({ block: "nearest" });
			}
		}
	}, [highlightedIndex, isOpen]);

	// --- SEARCH LOGIC ---
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newQuery = e.target.value;
		setQuery(newQuery);
		if (!isOpen) setIsOpen(true);

		// Find the first option that starts with what was typed
		if (newQuery) {
			const matchIndex = options.findIndex((opt) =>
				opt.name.toLowerCase().includes(newQuery.toLowerCase()),
			);
			if (matchIndex >= 0) {
				setHighlightedIndex(matchIndex);
			}
		} else {
			setHighlightedIndex(-1);
		}

		// If user clears input, clear selection
		if (newQuery === "") onChange("");
	};

	// --- KEYBOARD NAVIGATION ---
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (disabled) return;

		// Open on ArrowDown if closed
		if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
			e.preventDefault();
			handleOpen();
			return;
		}

		if (!isOpen) return;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev < options.length - 1 ? prev + 1 : prev,
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
				break;
			case "Enter":
				e.preventDefault();
				if (highlightedIndex >= 0 && options[highlightedIndex]) {
					const selected = options[highlightedIndex].name;
					onChange(selected);
					setQuery(selected);
					setIsOpen(false);
				}
				break;
			case "Escape":
				setIsOpen(false);
				// Revert to old value if cancelled
				setQuery(value);
				break;
			case "Tab":
				setIsOpen(false);
				break;
		}
	};

	// --- CLICK OUTSIDE & SCROLL HANDLERS ---
	useEffect(() => {
		const handleGlobalClick = (event: MouseEvent) => {
			if (containerRef.current?.contains(event.target as Node)) return;
			const portal = document.getElementById("combobox-portal");
			if (portal?.contains(event.target as Node)) return;

			setIsOpen(false);
			if (value) setQuery(value); // Revert text to selected value
		};

		const handleResize = () => setIsOpen(false);

		const handleScroll = (event: Event) => {
			const portal = document.getElementById("combobox-portal");
			if (portal?.contains(event.target as Node)) return;
			setIsOpen(false);
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleGlobalClick);
			window.addEventListener("resize", handleResize);
			window.addEventListener("scroll", handleScroll, true);
		}
		return () => {
			document.removeEventListener("mousedown", handleGlobalClick);
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("scroll", handleScroll, true);
		};
	}, [isOpen, value]);

	return (
		<div className="relative w-full" ref={containerRef}>
			<div className="relative">
				<input
					type="text"
					className={`w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all ${
						disabled
							? "bg-slate-100 text-slate-400 cursor-not-allowed"
							: ""
					}`}
					placeholder={placeholder}
					value={query}
					disabled={disabled}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onFocus={handleOpen}
					onClick={handleOpen}
				/>
				<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
					<svg
						width="10"
						height="6"
						viewBox="0 0 10 6"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M1 1L5 5L9 1" />
					</svg>
				</div>
			</div>

			{isOpen &&
				!disabled &&
				typeof document !== "undefined" &&
				createPortal(
					<div
						id="combobox-portal"
						style={{
							position: "absolute",
							top: coords.top,
							left: coords.left,
							width: coords.width,
							zIndex: 9999,
						}}
					>
						<ul
							ref={listRef}
							className="bg-white border border-slate-200 rounded-lg shadow-xl max-h-80 overflow-auto py-1 text-sm scroll-smooth"
						>
							{options.length === 0 ? (
								<li className="px-4 py-3 text-slate-400 italic text-center">
									No options available
								</li>
							) : (
								options.map((opt, idx) => {
									const isSelected = opt.name === value;
									const isHighlighted = idx === highlightedIndex;

									// GROUPING LOGIC: Check if category changed
									const prevCategory = idx > 0 ? options[idx - 1].category : null;
									const showHeader = opt.category && opt.category !== prevCategory;

									return (
										<React.Fragment key={idx}>
											{/* RENDER HEADER */}
											{showHeader && (
											<li className="px-4 py-1.5 bg-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0">
												{opt.category}
											</li>
											)}

											{/* RENDER OPTION */}
											<li
											data-index={idx}
											className={`px-4 py-2.5 cursor-pointer transition-colors text-xs ${
												isHighlighted
												? "bg-blue-600 text-white font-medium"
												: isSelected
												? "bg-blue-50 text-blue-700 font-medium"
												: "text-slate-700 hover:bg-slate-50"
											}`}
											onMouseEnter={() => setHighlightedIndex(idx)}
											onMouseDown={() => {
												onChange(opt.name);
												setQuery(opt.name);
												setIsOpen(false);
											}}
											>
											{opt.name}
											</li>
										</React.Fragment>
									);
								})
							)}
						</ul>
					</div>,
					document.body,
				)}
		</div>
	);
};
