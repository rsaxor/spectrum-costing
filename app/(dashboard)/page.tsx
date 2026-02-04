"use client";

import React, { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useQuoteCalculator } from "@/hooks/useQuoteCalculator";
import { PrintSize } from "@/lib/types";
import { Combobox } from "@/components/Combobox";
import { useRouter } from "next/navigation"; // Import Router
import { auth } from "@/lib/firebase"; // Import auth instance
import { signOut } from "firebase/auth"; // Import signOut
import { Button } from "@/components/ui/button"; // Using Shadcn Button
import {
	LogOut,
	ArrowDownToLine,
	TrendingUp,
	TicketPercent,
	X,
} from "lucide-react"; // Icon
import Image from "next/image";

export default function Dashboard() {
	const router = useRouter(); // Initialize router
	const currentYear = new Date().getFullYear();

  const userEmail = auth.currentUser?.email || "";
  const userName = userEmail.split('@')[0];

	// --- PRINTING STATE & REFS ---
	const componentRef = useRef<HTMLDivElement>(null);
	const [showPdfModal, setShowPdfModal] = useState(false);
	const [clientDetails, setClientDetails] = useState({
		project: "",
		clientName: "",
		contact: "",
	});

	const handlePrint = useReactToPrint({
		contentRef: componentRef,
		documentTitle: `costing_${userName}_${clientDetails.project}}`,
		onAfterPrint: () => setShowPdfModal(false), // Close modal after printing
	});

	const {
		printSize,
		jobQty,
		lines,
		grandTotal,
		discountPercentage,
		showDiscount,
		paperOptions,
		finishingOptions,
		isLoading,
		error,
		setPrintSize,
		setJobQty,
		setDiscountPercentage,
		setShowDiscount,
		addLine,
		removeLine,
		updateLine,
		isFixedQty,
	} = useQuoteCalculator();

	// --- LOGOUT HANDLER ---
	const handleLogout = async () => {
		try {
			await signOut(auth);
			router.push("/login");
		} catch (error) {
			console.error("Logout failed", error);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600 font-medium">
						Loading pricing engine...
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="bg-red-50 text-red-700 p-6 rounded-lg max-w-md text-center">
					<p className="font-bold mb-2">Failed to load data</p>
					<p className="text-sm">
						Please check your internet connection or the Google
						Sheet link.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
			{/* --- MODAL FOR PDF DETAILS --- */}
			{showPdfModal && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
						<div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
							<h3 className="font-bold text-lg text-slate-800">
								File Details
							</h3>
							<button
								onClick={() => setShowPdfModal(false)}
								className="text-slate-400 hover:text-slate-600"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="p-6 space-y-4">
							<div>
								<label className="block text-xs font-bold text-slate-500 uppercase mb-1">
									Project Name / Reference
								</label>
								<input
									autoFocus
									type="text"
									className="text-sm w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
									placeholder="e.g. Books/Presentation/Booklet/etc... OR ref-xxxxx"
									value={clientDetails.project}
									onChange={(e) =>
										setClientDetails({
											...clientDetails,
											project: e.target.value,
										})
									}
								/>
							</div>
							<div>
								<label className="block text-xs font-bold text-slate-500 uppercase mb-1">
									Client Name
								</label>
								<input
									type="text"
									className="text-sm w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
									placeholder="e.g. John Doe"
									value={clientDetails.clientName}
									onChange={(e) =>
										setClientDetails({
											...clientDetails,
											clientName: e.target.value,
										})
									}
								/>
							</div>
							<div>
								<label className="block text-xs font-bold text-slate-500 uppercase mb-1">
									Contact Details: Number + Email
								</label>
								<input
									type="text"
									className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
									placeholder="e.g. client@spectrumdubai.com | 055 555 5555"
									value={clientDetails.contact}
									onChange={(e) =>
										setClientDetails({
											...clientDetails,
											contact: e.target.value,
										})
									}
								/>
							</div>

							<div className="pt-4 flex gap-3">
								<Button
									onClick={() => handlePrint && handlePrint()}
									className="w-full bg-blue-600 hover:bg-blue-700"
								>
									Generate PDF
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* HEADER (Hidden on Print) */}
			<header className="bg-zinc-800 text-white shadow-lg top-0 z-50 print:hidden">
				<div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							Print Cost Estimator
						</h1>
						<p className="text-slate-400 text-sm">
							Spectrum Sustainable Print
						</p>
            <p className="text-xs mt-3 text-slate-400">
              Logged in as: {userEmail}
            </p>
						<Button
							variant="secondary"
							size="xs"
							onClick={handleLogout}
							className="flex items-center gap-2 mt-2"
						>
							<LogOut className="h-4 w-4" />
							Logout
						</Button>
					</div>

					<div className="flex items-center gap-6">
						<div className="text-right hidden sm:block">
							<div className="text-xs text-slate-400 uppercase font-bold tracking-wider my-1">
								Estimated Total
							</div>
							<div
								className={`text-3xl font-mono font-bold transition-colors ${
									showDiscount
										? "text-purple-400"
										: "text-green-500"
								}`}
							>
								{grandTotal.toLocaleString("en-US", {
									style: "currency",
									currency: "AED",
								})}
							</div>
							<div className="text-xs text-slate-400 uppercase font-bold tracking-wider my-1">
								{showDiscount
									? "With Discount *"
									: "Without Discount *"}
							</div>
							<div className="grid grid-flow-col justify-items-end-safe">
								{/* PDF BUTTON TRIGGERS MODAL */}
								<Button
									variant="secondary"
									size="xs"
									onClick={() => setShowPdfModal(true)}
									className="flex items-center gap-2 mt-2"
								>
									<ArrowDownToLine className="h-4 w-4" />
									Save as PDF
								</Button>
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* MAIN CONTENT (Wrapped in Ref for Printing) */}
			<main
				ref={componentRef}
				className="grow max-w-7xl w-full mx-auto px-6 mt-6 pb-64 print:p-5 print:mt-0"
			>
				{/* --- PRINT HEADER (Visible ONLY on Print) --- */}
				<div className="hidden print:block mb-8 pt-0 border-b-2 border-slate-800 pb-4">
					<div className="flex justify-between items-end">
						<div>
							<h1 className="text-3xl font-bold text-slate-900">
								Generated Costing Calculation
							</h1>
							<h3>* FOR INTERNAL USE ONLY *</h3>
							<p className="text-slate-500 text-sm mt-1">
								Spectrum Sustainable Print
							</p>
						</div>
						<div className="text-right grid justify-items-end-safe">
							<Image
								src="/Spectrum.jpg"
								alt="Spectrum logo"
								width={100}
								height={100}
								className={`h-auto object-contain`}
								priority
							/>
							<div className="mt-2 text-sm text-slate-600">
								Date: {new Date().toLocaleDateString()}
							</div>
							<div className="text-slate-600 text-sm">
								Generated by: {userEmail}
							</div>
						</div>
					</div>

					{(clientDetails.clientName || clientDetails.contact) && (
						<div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200">
							<div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
								DETAILS
							</div>
							<div className="text-slate-900 font-bold">
								{clientDetails.project}
							</div>
							<div className="font-bold text-lg text-slate-600">
								{clientDetails.clientName}
							</div>
							<div className="text-slate-600">
								{clientDetails.contact}
							</div>
						</div>
					)}
				</div>

				{/* GLOBAL CONTROLS */}
				<div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-6 print:shadow-none print:border-none print:mb-2">
					<div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-end print:p-0 print:gap-4 print:block">
						{/* 1. Size & Qty Summary (Print Friendly) */}
						<div className="md:col-span-8 print:w-full print:mb-4">
							{/* Screen View */}
							<div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-8">
								<div>
									<label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
										1. Select Print Size
									</label>
									<div className="flex bg-slate-100 p-1 rounded-lg w-fit">
										{(
											["A3", "A4", "A5"] as PrintSize[]
										).map((size) => (
											<button
												key={size}
												onClick={() =>
													setPrintSize(size)
												}
												className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
													printSize === size
														? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
														: "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
												}`}
											>
												{size}
											</button>
										))}
									</div>
								</div>
								<div>
									<label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
										2. Total Job Quantity
									</label>
									<div className="relative">
										<input
											type="number"
											min="0"
											value={jobQty === 0 ? "" : jobQty}
											onChange={(e) =>
												setJobQty(
													Number(e.target.value),
												)
											}
											className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-lg transition-all"
										/>
									</div>
								</div>
							</div>

							{/* Print View (Static Text) */}
							<div className="hidden print:flex gap-12 bg-slate-50 p-4 rounded border border-slate-200">
								<div>
									<span className="text-xs font-bold text-slate-500 uppercase block">
										Print Size
									</span>
									<span className="text-xl font-bold text-slate-900">
										{printSize}
									</span>
								</div>
								<div>
									<span className="text-xs font-bold text-slate-500 uppercase block">
										Job Quantity
									</span>
									<span className="text-xl font-bold text-slate-900">
										{jobQty.toLocaleString()} units
									</span>
								</div>
							</div>
						</div>

						{/* 3. Pricing Strategy (Hidden on Print to hide discount logic, or Show Summary) */}
						{/* HIDE the controls but apply the result. */}
						<div className="md:col-span-4 bg-slate-50 p-4 rounded-lg border border-slate-100 print:hidden">
							<div className="flex items-center justify-between mb-2">
								<label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
									<TicketPercent className="w-5 h-5" />{" "}
									Discount
								</label>
								<div className="flex items-center gap-2">
									<label
										htmlFor="discountToggle"
										className="text-[10px] font-bold uppercase text-slate-400 cursor-pointer select-none"
									>
										{showDiscount ? "Applied" : "Off"}
									</label>
									<div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
										<input
											type="checkbox"
											id="discountToggle"
											checked={showDiscount}
											onChange={(e) =>
												setShowDiscount(
													e.target.checked,
												)
											}
											className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-purple-600 transition-all duration-300 right-5"
										/>
										<label
											htmlFor="discountToggle"
											className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer border border-slate-300 ${showDiscount ? "bg-purple-600" : "bg-slate-300"}`}
										></label>
									</div>
								</div>
							</div>
							<div className="relative">
								<input
									type="number"
									min="0"
									value={
										discountPercentage === 0
											? ""
											: discountPercentage
									}
									onChange={(e) => {
										let val = parseFloat(e.target.value);
										if (isNaN(val)) {
											setDiscountPercentage(0);
											return;
										}
										if (val < 0) val = 0;
										if (val > 15) val = 15;
										setDiscountPercentage(val);
									}}
									className={`w-full pl-4 pr-8 py-2 border rounded-lg focus:ring-2 outline-none font-mono text-lg transition-all ${
										showDiscount
											? "bg-white border-purple-300 text-purple-700 font-bold"
											: "bg-slate-100 text-slate-400 border-slate-200"
									}`}
								/>
								<span className="absolute right-3 top-3 text-slate-400 font-bold text-sm">
									%
								</span>
								{/* Optional: Tiny warning text if they hit the limit */}
								{discountPercentage === 15 && (
									<span className="absolute right-0 -bottom-5 text-[10px] text-red-500 font-bold">
										Max discount is 15%
									</span>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* LINE ITEMS TABLE */}
				<div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden min-h-100 flex flex-col print:shadow-none print:border print:border-slate-300">
					<div className="overflow-x-auto grow">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider print:bg-slate-100 print:text-slate-700">
									<th className="py-4 pl-6 w-20">Type</th>
									<th className="py-4 px-4 w-40">Label</th>
									<th className="py-4 px-4 ">Description</th>
									<th className="py-4 px-4 w-30 text-center">
										Qty
									</th>
									<th className="py-4 px-4 w-24 print:hidden">
										Range
									</th>
									<th className="py-4 px-4 w-28 text-right">
										Unit Price
									</th>
									<th className="py-4 px-4 w-32 text-right pr-6">
										Total
									</th>
									<th className="py-4 w-10 print:hidden"></th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 print:divide-slate-200">
								{lines.map((line) => (
									<tr
										key={line.id}
										className="group hover:bg-slate-50/80 transition-colors print:break-inside-avoid"
									>
										{/* TYPE */}
										<td className="py-4 pl-6 align-top">
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold print:border print:border-slate-300 print:bg-transparent print:text-slate-800 ${
													line.type === "PAPER"
														? "bg-blue-100 text-blue-800"
														: "bg-purple-100 text-purple-800"
												}`}
											>
												{line.type}
											</span>
										</td>

										{/* LABEL */}
										<td className="py-3 px-4 align-top">
											{/* Input for Screen */}
											<input
												type="text"
												placeholder="..."
												className="print:hidden w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
												value={line.label}
												onChange={(e) =>
													updateLine(
														line.id,
														"label",
														e.target.value,
													)
												}
											/>
											{/* Text for Print */}
											<div className="hidden print:block text-sm font-medium text-slate-800 py-2">
												{line.label || "-"}
											</div>
										</td>

										{/* DESCRIPTION (Combobox) */}
										<td className="py-3 px-4 align-top w-87.5">
											<div className="print:hidden">
												<Combobox
													options={
														line.type === "PAPER"
															? paperOptions
															: finishingOptions
													}
													value={line.name}
													onChange={(val) =>
														updateLine(
															line.id,
															"name",
															val,
														)
													}
													placeholder="Select item..."
												/>
											</div>
											<div className="hidden print:block text-sm text-slate-700 py-2">
												{line.name || (
													<span className="text-slate-300 italic">
														Not selected
													</span>
												)}
											</div>
										</td>

										{/* QTY */}
										<td className="py-3 px-4 align-top">
											<input
												type="number"
												className={`print:hidden w-full p-2.5 border border-slate-300 rounded-lg text-center font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm ${
													isFixedQty(line)
														? "bg-slate-100 text-slate-500"
														: ""
												}`}
												value={line.qty || ""}
												disabled={isFixedQty(line)}
												onChange={(e) =>
													updateLine(
														line.id,
														"qty",
														Number(e.target.value),
													)
												}
											/>
											<div className="hidden print:block text-center text-sm font-mono py-2">
												{line.qty}
											</div>
										</td>

										{/* RANGE (Hidden on Print) */}
										<td className="py-4 px-4 align-top print:hidden">
											<div
												className={`text-xs font-bold px-2 py-1 rounded w-fit ${
													line.rangeLabel !== "-" &&
													line.rangeLabel !==
														"Out of Range"
														? "bg-green-100 text-green-700"
														: "bg-slate-100 text-slate-400"
												}`}
											>
												{line.rangeLabel}
											</div>
										</td>

										{/* UNIT PRICE */}
										<td className="py-4 px-4 text-right font-mono text-sm text-slate-600 align-top">
											{line.unitPrice > 0
												? line.unitPrice.toFixed(2)
												: "-"}
										</td>

										{/* TOTAL */}
										<td className="py-4 px-4 pr-6 text-right font-mono font-bold text-slate-900 align-top">
											{line.totalPrice > 0
												? line.totalPrice.toLocaleString(
														"en-US",
														{
															style: "currency",
															currency: "AED",
														},
													)
												: "-"}
										</td>

										{/* DELETE (Hidden on Print) */}
										<td className="py-4 text-center align-top print:hidden">
											<button
												onClick={() =>
													removeLine(line.id)
												}
												className="p-2 text-slate-400 hover:text-red-600 rounded-full"
											>
												<svg
													className="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M18 6L6 18M6 6l12 12"
													/>
												</svg>
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* ADD BUTTONS (Hidden on Print) */}
					<div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-4 print:hidden">
						<button
							onClick={() => addLine("PAPER")}
							className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-blue-50"
						>
							<span className="text-lg leading-none">+</span> Add
							Paper Material
						</button>
						<button
							onClick={() => addLine("FINISHING")}
							className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-purple-700 font-semibold rounded-lg shadow-sm hover:bg-purple-50"
						>
							<span className="text-lg leading-none">+</span> Add
							Finishing
						</button>
					</div>
				</div>

				{/* PRINT TOTALS (Visible ONLY on Print) */}
				<div className="hidden print:flex flex-col items-end mt-4 pt-4 border-t border-slate-800">
					<div className="w-64">
						<div className="flex justify-between mb-2">
							<span className="text-slate-500 text-sm">
								Subtotal
							</span>
							<span className="font-mono">
								{grandTotal.toLocaleString("en-US", {
									style: "currency",
									currency: "AED",
								})}
							</span>
						</div>
						{showDiscount && discountPercentage > 0 && (
							<div className="flex justify-between mb-2 text-green-600">
								<span className="text-sm">
									Discount ({discountPercentage}%)
								</span>
								<span className="font-mono text-sm">
									Included
								</span>
							</div>
						)}
						<div className="flex justify-between pt-2 border-t border-slate-300 mt-2">
							<span className="font-bold text-lg">Total</span>
							<span className="font-bold font-mono text-xl">
								{grandTotal.toLocaleString("en-US", {
									style: "currency",
									currency: "AED",
								})}
							</span>
						</div>
					</div>
				</div>
			</main>

			<footer className="bg-zinc-800 text-white shadow-lg p-5 mt-auto print:hidden">
				<h6 className="text-[8px] text-center uppercase tracking-widest">
					Developed by{" "}
					<a href="mailto:ralph@spectrumdubai.com">
						<b>ralph@spectrumdubai.com</b>
					</a>{" "}
					for{" "}
					<a href="https://spectrumdubai.com">
						<b>Spectrum Print Solutions</b>
					</a>
					<br />© {currentYear}
				</h6>
			</footer>
		</div>
	);
}
