import React, { useState } from 'react';
import type { QuoteResponse } from '../types';
import { supabase } from '../lib/supabase';

interface QuoteResultProps {
  data: QuoteResponse;
  onReset: () => void;
}

export const QuoteResult: React.FC<QuoteResultProps> = ({ data, onReset }) => {
  const { raw_requirement, suggested_price, confidence_score, cost_breakdown, risk_warnings, similar_cases } = data;
  const score = Math.round(confidence_score * 100);
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsApproving(true);
    setApproveError(null);
    try {
      const { error: invokeError } = await supabase.functions.invoke('approve-quote', {
        body: { 
          raw_requirement: raw_requirement,
          unit_price: suggested_price
        },
      });

      if (invokeError) throw new Error(invokeError.message);
      
      alert('Data synthesis complete. Record saved to RAG history.');
      onReset();
    } catch (err: any) {
      setApproveError(err.message || 'system error');
      setIsApproving(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 font-sans tracking-wide">
      
      {/* 頂部面板 (Top Panel) */}
      <div className="bg-[#f1ead9] rounded-[2.5rem] p-4 flex flex-col md:flex-row gap-4">
        
        {/* 圓形圖表區 (Graphic Area) */}
        <div className="bg-[#171312] rounded-4xl p-8 w-full md:w-1/3 flex flex-col items-center justify-center relative overflow-hidden min-h-[250px]">
          <div className="text-[#A89680] text-xs font-bold uppercase tracking-widest absolute top-6 left-6">
            recon
          </div>
          <div className="w-40 h-40 rounded-full border-16 border-[#E57E52] border-t-[#EBB362] border-l-[#E85B5C] border-b-[#A89680] flex items-center justify-center shadow-inner relative">
            <div className="w-24 h-24 rounded-full border-4 border-[#332b29] flex items-center justify-center">
              <span className="text-[#f1ead9] text-5xl font-black">{score}</span>
            </div>
            {/* 裝飾線 */}
            <div className="absolute top-1/2 left-[-20px] w-[180px] h-0.5 bg-[#f1ead9]/10 rotate-45"></div>
          </div>
        </div>

        {/* 核心數據區 (Main Stats) */}
        <div className="bg-[#171312] rounded-4xl p-8 sm:p-12 w-full md:w-2/3 text-[#f1ead9] flex flex-col justify-center relative">
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="bg-[#f1ead9] text-[#171312] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              oem_quote
            </div>
            <div className="bg-[#EBB362] text-[#171312] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              cycles {Math.floor(Math.random() * 20000)}
            </div>
            <div className="bg-[#A89680] text-[#171312] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              rigel system
            </div>
          </div>
          
          <div className="text-6xl sm:text-[5.5rem] font-medium tracking-tighter leading-none mb-3">
            <span className="text-4xl text-[#E57E52] mr-2">$</span>
            {suggested_price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          
          <div className="text-[#A89680] text-lg uppercase tracking-widest font-bold">
            estimated unit cost
          </div>
        </div>
      </div>

      {/* 底部面板 (Bottom Panel) */}
      <div className="bg-[#f1ead9] rounded-[2.5rem] p-6 sm:p-8">
        
        <div className="flex justify-between items-center mb-8 px-4 text-xs font-bold uppercase tracking-widest text-[#171312]">
          <div className="flex items-center gap-4">
            <span>ø13_49_66 // data_synthesis</span>
            {approveError && <span className="text-[#E85B5C] bg-[#171312] px-2 py-1 rounded-full">! {approveError}</span>}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onReset} 
              disabled={isApproving}
              className="bg-[#171312] text-[#f1ead9] px-5 py-2 rounded-full hover:bg-[#E85B5C] transition-colors disabled:opacity-50"
            >
              reject / regenerate
            </button>
            <button 
              onClick={handleApprove} 
              disabled={isApproving}
              className="bg-[#E57E52] text-[#171312] px-6 py-2 rounded-full hover:bg-[#EBB362] transition-colors disabled:opacity-50 font-black shadow-md flex items-center gap-2"
            >
              {isApproving ? 'syncing...' : 'approve & save'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4">
          
          {/* 左側膠囊 (Costs) */}
          <div className="col-span-2 lg:col-span-3 bg-[#E57E52] rounded-4xl p-6 flex flex-col justify-between min-h-[220px]">
            <div className="text-[#171312] text-xs font-bold uppercase tracking-widest">material</div>
            <div className="text-[#171312] text-4xl sm:text-5xl font-medium tracking-tighter">
              ${cost_breakdown.material.toLocaleString()}
            </div>
          </div>
          
          <div className="col-span-2 lg:col-span-3 bg-[#EBB362] rounded-4xl p-6 flex flex-col justify-between min-h-[220px]">
            <div className="text-[#171312] text-xs font-bold uppercase tracking-widest">machining</div>
            <div className="text-[#171312] text-4xl sm:text-5xl font-medium tracking-tighter">
              ${cost_breakdown.machining.toLocaleString()}
            </div>
          </div>

          <div className="col-span-2 md:col-span-4 lg:col-span-3 bg-[#171312] rounded-4xl p-6 flex flex-col justify-between min-h-[220px]">
            <div className="text-[#A89680] text-xs font-bold uppercase tracking-widest">outsourcing</div>
            <div className="text-[#f1ead9] text-4xl sm:text-5xl font-medium tracking-tighter">
              ${cost_breakdown.outsourcing.toLocaleString()}
            </div>
          </div>

          {/* 右側異常與案例 */}
          <div className="col-span-2 md:col-span-4 lg:col-span-3 space-y-4">
            
            <div className="bg-[#E85B5C] rounded-4xl p-6 h-[102px] flex flex-col justify-center relative overflow-hidden">
              <div className="text-[#171312] text-xs font-bold uppercase tracking-widest mb-1">anomalies</div>
              <div className="text-[#171312] text-xl font-medium tracking-tight">
                {risk_warnings?.length ? `${risk_warnings.length} detected` : 'null'}
              </div>
              <div className="absolute top-4 right-4 font-black text-4xl opacity-20 text-[#171312]">!</div>
            </div>

            <div className="bg-[#A89680] rounded-4xl p-6 h-[102px] flex flex-col justify-center">
              <div className="text-[#171312] text-xs font-bold uppercase tracking-widest mb-1">similar cases</div>
              <div className="text-[#171312] text-xl font-medium tracking-tight">
                {similar_cases?.length || 0} matched
              </div>
            </div>
            
          </div>

          {/* 橫向長方塊：歷史案例列表 (選用) */}
          {similar_cases && similar_cases.length > 0 && (
            <div className="col-span-2 md:col-span-4 lg:col-span-12 bg-[#171312] rounded-4xl p-6 flex flex-wrap gap-4 items-center">
               <span className="text-[#A89680] text-xs font-bold uppercase tracking-widest w-full lg:w-auto">
                 techo-signatures:
               </span>
               {similar_cases.map((c, i) => (
                 <div key={c.id} className="bg-[#f1ead9] px-4 py-2 rounded-full text-[#171312] text-sm font-bold flex items-center gap-2">
                   <span>ID_{i+1}</span>
                   <span className="opacity-50">/</span>
                   <span>${c.unit_price}</span>
                 </div>
               ))}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};
