import React, { useState, useEffect } from 'react';
import type { QuoteResponse } from '../types';
import { supabase } from '../lib/supabase';

interface QuoteFormProps {
  onQuoteReceived: (quote: QuoteResponse) => void;
}

const loadingStages = ['recon', 'engage', 'synthesis', 'atomise'];

export const QuoteForm: React.FC<QuoteFormProps> = ({ onQuoteReceived }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    material: '',
    style: '',
    deliveryDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStageIndex((prev) => (prev < loadingStages.length - 1 ? prev + 1 : prev));
      }, 800);
    } else {
      setLoadingStageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { quantity, material, style, deliveryDate } = formData;
    if (!quantity || !material || !style || !deliveryDate) {
      setError('missing parameters');
      return;
    }

    const combinedRequirement = `${quantity}個${material}${style}，${deliveryDate}交`;

    setIsLoading(true);
    setError(null);
    setLoadingStageIndex(0);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke<QuoteResponse>('generate-quote', {
        body: { raw_requirement: combinedRequirement },
      });

      if (invokeError) throw new Error(invokeError.message);
      if (data) {
        data.raw_requirement = combinedRequirement;
        onQuoteReceived(data);
      } else {
        throw new Error('null response');
      }
    } catch (err: any) {
      setError(err.message || 'system error');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-[#f1ead9] text-[#171312] border-none rounded-full px-6 py-4 placeholder-[#171312]/40 focus:outline-none focus:ring-4 focus:ring-[#E57E52] transition-all text-sm font-bold tracking-wide";
  const labelClass = "text-[#f1ead9] text-xs font-bold uppercase tracking-widest pl-4 mb-2 block";

  return (
    <div className="w-full bg-[#f1ead9] rounded-[2.5rem] p-6 sm:p-8 flex flex-col md:flex-row gap-6 animate-in fade-in zoom-in-95 duration-500 font-sans">
      
      {/* 左側邊欄 (Side Navigation Pills) */}
      <div className="flex flex-col gap-3 w-full md:w-48">
        <div className="bg-[#171312] text-[#f1ead9] px-6 py-4 rounded-full text-xs font-bold uppercase tracking-widest">
          regenerate
        </div>
        <div className={`px-6 py-4 rounded-full text-[#171312] text-xs font-bold uppercase tracking-widest transition-colors ${isLoading && loadingStageIndex >= 0 ? 'bg-[#E85B5C]' : 'bg-[#E57E52] opacity-40'}`}>
          recon
        </div>
        <div className={`px-6 py-4 rounded-full text-[#171312] text-xs font-bold uppercase tracking-widest transition-colors ${isLoading && loadingStageIndex >= 1 ? 'bg-[#EBB362]' : 'bg-[#EBB362] opacity-40'}`}>
          engage
        </div>
        <div className={`px-6 py-4 rounded-full text-[#171312] text-xs font-bold uppercase tracking-widest transition-colors ${isLoading && loadingStageIndex >= 2 ? 'bg-[#A89680]' : 'bg-[#A89680] opacity-40'}`}>
          synthesis
        </div>
        <div className={`px-6 py-4 rounded-full text-[#171312] text-xs font-bold uppercase tracking-widest transition-colors ${isLoading && loadingStageIndex >= 3 ? 'bg-[#f1ead9] border-2 border-[#171312]' : 'bg-[#171312] opacity-10'}`}>
          atomise
        </div>
      </div>

      {/* 右側表單區 (Main Form Area) */}
      <div className="flex-1 bg-[#171312] rounded-4xl p-8 sm:p-12 relative flex flex-col justify-between min-h-[500px]">
        
        <div className="flex justify-between items-start mb-12">
          <div className="flex flex-wrap gap-3">
            <div className="bg-[#E57E52] text-[#171312] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span>ø6</span>
            </div>
            <div className="bg-[#f1ead9] text-[#171312] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              cycle 13_176
            </div>
          </div>
          
          <div className="text-[#A89680] text-[2.5rem] font-black leading-none tracking-tighter hidden sm:block">
            ₥7☼3
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-center">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>quantity</label>
              <input type="text" name="quantity" value={formData.quantity} onChange={handleChange} disabled={isLoading} className={inputClass} placeholder="e.g. 500" />
            </div>
            <div>
              <label className={labelClass}>material</label>
              <input type="text" name="material" value={formData.material} onChange={handleChange} disabled={isLoading} className={inputClass} placeholder="e.g. AL6061" />
            </div>
            <div>
              <label className={labelClass}>style</label>
              <input type="text" name="style" value={formData.style} onChange={handleChange} disabled={isLoading} className={inputClass} placeholder="e.g. bracket" />
            </div>
            <div>
              <label className={labelClass}>deadline</label>
              <input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} disabled={isLoading} className={inputClass} />
            </div>
          </div>

          {error && (
            <div className="bg-[#E85B5C] text-[#171312] rounded-full px-6 py-3 text-sm font-bold uppercase tracking-widest mt-4">
              ! {error}
            </div>
          )}

          <div className="pt-8">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E57E52] text-[#171312] hover:bg-[#EBB362] transition-colors rounded-full py-5 font-bold text-lg uppercase tracking-widest disabled:opacity-50"
            >
              {isLoading ? 'initializing sequence...' : 'engage process'}
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
};
