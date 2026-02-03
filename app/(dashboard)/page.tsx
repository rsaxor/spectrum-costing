"use client";

import React from 'react';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import { PrintSize } from '@/lib/types';
import { Combobox } from '@/components/Combobox';
import { useRouter } from "next/navigation"; // Import Router
import { auth } from "@/lib/firebase";       // Import auth instance
import { signOut } from "firebase/auth";     // Import signOut
import { Button } from "@/components/ui/button"; // Using Shadcn Button
import { LogOut, ArrowRight, TrendingUp } from "lucide-react"; // Icon

export default function Dashboard() {
  const router = useRouter(); // Initialize router
  const currentYear = new Date().getFullYear();
  const {
    printSize,  
    jobQty,
    lines,
    grandTotal,
    markupPercentage,
    showMarkup,
    paperOptions,
    finishingOptions,
    isLoading,
    error,
    setPrintSize,
    setJobQty,
    setMarkupPercentage,
    setShowMarkup,
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
          <p className="text-gray-600 font-medium">Loading pricing engine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg max-w-md text-center">
          <p className="font-bold mb-2">Failed to load data</p>
          <p className="text-sm">Please check your internet connection or the Google Sheet link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      
      <header className="bg-zinc-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Print Cost Estimator</h1>
            <p className="text-slate-400 text-sm">Spectrum Sustainable Print</p>
            <Button 
              variant="secondary" 
              size="xs"
              onClick={handleLogout}
              className="flex items-center gap-2 mt-3"
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
              <div className={`text-3xl font-mono font-bold transition-colors ${
                showMarkup ? "text-purple-400" : "text-green-500"
              }`}>
                {grandTotal.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
              </div>
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">
                {showMarkup ? "With Markup *" : "No Markup *"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="grow max-w-7xl w-full mx-auto px-6 mt-6 pb-64">
        
        {/* GLOBAL CONTROLS */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-6">
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            
            {/* 1. Size (4 Cols) */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                1. Select Print Size
              </label>
              <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                {(['A3', 'A4', 'A5'] as PrintSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setPrintSize(size)}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                      printSize === size
                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Quantity (4 Cols) */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                2. Total Job Quantity
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={jobQty === 0 ? '' : jobQty}
                  onChange={(e) => setJobQty(Number(e.target.value))}
                  className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-lg transition-all"
                />
              </div>
            </div>

            {/* 3. Pricing Strategy (4 Cols) */}
            <div className="md:col-span-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
               <div className="flex items-center justify-between mb-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                   <TrendingUp className="w-3 h-3" /> Markup %
                 </label>
                 
                 {/* Toggle Switch */}
                 <div className="flex items-center gap-2">
                    <label htmlFor="markupToggle" className="text-[10px] font-bold uppercase text-slate-400 cursor-pointer select-none">
                      {showMarkup ? "Applied" : "Off"}
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                          type="checkbox" 
                          name="toggle" 
                          id="markupToggle" 
                          checked={showMarkup}
                          onChange={(e) => setShowMarkup(e.target.checked)}
                          className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-purple-600 transition-all duration-300 right-5"
                        />
                        <label htmlFor="markupToggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer border border-slate-300 ${showMarkup ? 'bg-purple-600' : 'bg-slate-300'}`}></label>
                    </div>
                 </div>
               </div>

               <div className="relative">
                 <input
                   type="number"
                   min="0"
                   value={markupPercentage === 0 ? '' : markupPercentage}
                   onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                   placeholder="0"
                   className={`w-full pl-4 pr-8 py-2 border rounded-lg focus:ring-2 outline-none font-mono text-lg transition-all ${
                      showMarkup 
                      ? "bg-white border-purple-300 focus:ring-purple-500 text-purple-700 font-bold" 
                      : "bg-slate-100 text-slate-400 border-slate-200"
                   }`}
                 />
                 <span className="absolute right-3 top-3 text-slate-400 font-bold text-sm">%</span>
               </div>
            </div>
          </div>
        </div>

        {/* LINE ITEMS TABLE */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden min-h-100 flex flex-col">
          <div className="overflow-x-auto grow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 pl-6 w-20">Type</th>
                  <th className="py-4 px-4 w-40">Label / Section</th>
                  <th className="py-4 px-4 ">Material / Description</th>
                  <th className="py-4 px-4 w-30 text-center">Qty <br /><span className="normal-case font-normal text-slate-400">(per line item)</span></th>
                  <th className="py-4 px-4 w-24">Range</th>
                  <th className="py-4 px-4 w-28 text-right">
                    {showMarkup ? "Unit Cost w/ +% " : "Unit Cost"}
                  </th>
                  <th className="py-4 px-4 w-32 text-right pr-6">
                    {showMarkup ? "Line Total w/ +%" : "Line Total"}
                  </th>
                  <th className="py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((line) => (
                  <tr key={line.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 pl-6 align-top">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${
                        line.type === 'PAPER' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {/* {line.type === 'PAPER' ? 'PPR' : 'FIN'} */}
                        {line.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <input
                        type="text"
                        placeholder={line.type === 'PAPER' ? "e.g. Cover" : "e.g. Binding"}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm placeholder-slate-300"
                        value={line.label}
                        onChange={(e) => updateLine(line.id, 'label', e.target.value)}
                      />
                    </td>
                    {/* --- NEW COMBOBOX COLUMN --- */}
                    <td className="py-3 px-4 align-top w-87.5"> 
                      <Combobox
                        options={line.type === 'PAPER' ? paperOptions : finishingOptions}
                        value={line.name}
                        onChange={(val) => updateLine(line.id, 'name', val)}
                        placeholder={line.type === 'PAPER' ? "Search Paper..." : "Search Finishing..."}
                      />
                    </td>

                    <td className="py-3 px-4 align-top">
                      <input
                        type="number"
                        min="0"
                        // DISABLE LOGIC:
                        disabled={isFixedQty(line)} 
                        className={`w-full p-2.5 border border-slate-300 rounded-lg text-center font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm ${
                          isFixedQty(line) ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                        }`}
                        value={line.qty || ''}
                        placeholder="0"
                        onChange={(e) => updateLine(line.id, 'qty', Number(e.target.value))}
                      />
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className={`text-xs font-bold px-2 py-1 rounded w-fit ${
                        line.rangeLabel !== '-' && line.rangeLabel !== 'Out of Range' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-400'
                      }`}>
                        {line.rangeLabel}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-slate-600 align-top">
                      {line.unitPrice > 0 ? line.unitPrice.toFixed(2) : '-'}
                    </td>
                    <td className="py-4 px-4 pr-6 text-right font-mono font-bold text-slate-900 align-top">
                      {line.totalPrice > 0 
                        ? line.totalPrice.toLocaleString('en-US', { style: 'currency', currency: 'AED' }) 
                        : '-'}
                    </td>
                    <td className="py-4 text-center align-top">
                      <button
                        onClick={() => removeLine(line.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                        title="Remove Line"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}

                {lines.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                        <p className="text-lg font-medium text-slate-500">No items in this quote</p>
                        <p className="text-sm">Add a material or finishing below to start calculating.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-4">
            <button
              onClick={() => addLine('PAPER')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all active:scale-95"
            >
              <span className="text-lg leading-none">+</span> Add Paper Material
            </button>
            
            <button
              onClick={() => addLine('FINISHING')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-purple-700 font-semibold rounded-lg shadow-sm hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all active:scale-95"
            >
              <span className="text-lg leading-none">+</span> Add Finishing
            </button>
          </div>
        </div>

      </main>
      <footer className="bg-zinc-800 text-white shadow-lg p-5 mt-auto">
        <h6 className="text-[8px] text-center uppercase tracking-widest">Developed by <a href="mailto:ralph@spectrumdubai.com"><b>ralph@spectrumdubai.com</b></a> <br />for <a href="https://spectrumdubai.com"><b>Spectrum Print Solutions</b></a><br />© {currentYear}</h6>
      </footer>
    </div>
  );
}