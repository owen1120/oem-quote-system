import React, { useState, useEffect } from 'react';
import type { QuoteResponse } from '../types';
import { supabase } from '../lib/supabase';

interface QuoteFormProps {
  onQuoteReceived: (quote: QuoteResponse) => void;
}

const loadingStages = ['recon', 'engage', 'synthesis', 'atomise'];

export const QuoteForm: React.FC<QuoteFormProps> = ({ onQuoteReceived }) => {
  const [formData, setFormData] = useState({
    partName: '',
    material: '鋁合金6061',
    quantity: '',
    length: '',
    width: '',
    height: '',
    holeCount: '',
    shapeType: '矩形',
    shapeComplexity: '普通',
    machiningMethods: [] as string[],
    holeDepth: '',
    isBlindHole: '否',
    isTapping: '否',
    threadSpec: '無',
    threadDepth: '',
    surfaceTreatment: '無',
    toleranceGrade: '一般',
    deliveryTime: '一般件',
    profitMargin: '25'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleCheckboxChange = (method: string) => {
    setFormData(prev => ({
      ...prev,
      machiningMethods: prev.machiningMethods.includes(method)
        ? prev.machiningMethods.filter(m => m !== method)
        : [...prev.machiningMethods, method]
    }));
  };

  useEffect(() => {
    let stageInterval: ReturnType<typeof setInterval>;
    let progressInterval: ReturnType<typeof setInterval>;

    if (isLoading) {
      stageInterval = setInterval(() => {
        setLoadingStageIndex((prev) => (prev < loadingStages.length - 1 ? prev + 1 : prev));
      }, 800);

      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 98) return prev;
          const jump = Math.random() * 15;
          return Math.min(98, prev + jump);
        });
      }, 300);
    } else {
      setLoadingStageIndex(0);
      setProgress(0);
    }
    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { partName, material, quantity, length, width, height, holeCount, shapeType, shapeComplexity, machiningMethods, holeDepth, isBlindHole, isTapping, threadSpec, threadDepth, surfaceTreatment, toleranceGrade, deliveryTime, profitMargin } = formData;
    if (!partName || !material || !quantity) {
      setError('missing critical parameters');
      return;
    }

    const methodsStr = machiningMethods.length > 0 ? machiningMethods.join(', ') : '無特別指定';
    const combinedRequirement = `
零件名稱: ${partName}
材質: ${material}
數量: ${quantity}個
尺寸: ${length}x${width}x${height} mm
孔數: ${holeCount}
外型: ${shapeType} (複雜度: ${shapeComplexity})
加工方式: ${methodsStr}
孔深: ${holeDepth} mm (盲孔: ${isBlindHole})
攻牙: ${isTapping === '是' ? `牙規 ${threadSpec}, 牙深 ${threadDepth} mm` : '無'}
表面處理: ${surfaceTreatment}
公差等級: ${toleranceGrade}
交期: ${deliveryTime}
利潤率: ${profitMargin}%
    `.trim();

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

  const inputClass = "w-full bg-[#f1ead9] text-[#171312] border-none rounded-2xl px-5 py-3 placeholder-[#171312]/40 focus:outline-none focus:ring-4 focus:ring-[#E57E52] transition-all text-sm font-bold tracking-wide";
  const selectClass = "w-full bg-[#f1ead9] text-[#171312] border-none rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-[#E57E52] transition-all text-sm font-bold tracking-wide appearance-none cursor-pointer";
  const labelClass = "text-[#f1ead9] text-[10px] font-bold uppercase tracking-widest pl-2 mb-1.5 block opacity-80";

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
      <div className="flex-1 bg-[#171312] rounded-4xl p-8 sm:p-12 relative flex flex-col justify-between min-h-[500px] overflow-hidden">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-[#171312]/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="text-[#E57E52] text-7xl font-black mb-4 tracking-tighter tabular-nums">
              {Math.floor(progress)}%
            </div>
            
            <div className="w-64 h-2 bg-[#f1ead9]/20 rounded-full overflow-hidden mb-6 relative">
              <div 
                className="absolute top-0 left-0 h-full bg-[#E57E52] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="text-[#f1ead9] text-sm font-bold uppercase tracking-widest animate-pulse">
              {loadingStages[loadingStageIndex] || 'processing'}...
            </div>
          </div>
        )}

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
          
          {/* File Upload Zone (Mock for CNC Mill-Turn CAD) */}
          <div className="mb-2">
            <label className={labelClass}>UPLOAD CAD / DRAWING (STEP, IGES, PDF)</label>
            <div className="relative w-full border-2 border-dashed border-[#A89680]/30 rounded-4xl p-6 flex flex-col items-center justify-center bg-[#171312] hover:border-[#E57E52] hover:bg-[#1a1614] transition-all group overflow-hidden">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept=".step,.stp,.iges,.igs,.pdf,.dxf"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <div className="text-[#A89680] group-hover:text-[#E57E52] transition-colors mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <p className="text-[#f1ead9] text-sm font-bold uppercase tracking-widest text-center z-20 pointer-events-none">
                {uploadedFile ? uploadedFile.name : "DRAG & DROP OR CLICK TO UPLOAD"}
              </p>
              <p className="text-[#A89680] text-[0.65rem] mt-2 uppercase tracking-widest text-center z-20 pointer-events-none">
                {uploadedFile ? "FILE READY FOR AI EXTRACTION" : "AI FEATURE EXTRACTION COMING SOON"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>零件名稱 (Part Name)</label>
              <input type="text" name="partName" value={formData.partName} onChange={handleChange} disabled={isLoading} className={inputClass} placeholder="e.g. 展示用鋁合金支架" />
            </div>
            
            <div>
              <label className={labelClass}>材質 (Material)</label>
              <select name="material" value={formData.material} onChange={handleChange} disabled={isLoading} className={selectClass}>
                <option>鋁合金6061</option><option>鋁合金7075</option><option>不鏽鋼304</option><option>不鏽鋼316</option><option>中碳鋼S45C</option><option>黃銅</option><option>紅銅</option><option>鈦合金</option><option>POM</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>數量 (Quantity)</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} disabled={isLoading} className={inputClass} />
            </div>
            
            <div className="sm:col-span-2 grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>長度 L (mm)</label>
                <input type="number" name="length" value={formData.length} onChange={handleChange} disabled={isLoading} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>寬度 W (mm)</label>
                <input type="number" name="width" value={formData.width} onChange={handleChange} disabled={isLoading} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>高度 H (mm)</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} disabled={isLoading} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>外型類型 (Shape)</label>
              <select name="shapeType" value={formData.shapeType} onChange={handleChange} disabled={isLoading} className={selectClass}>
                <option>矩形</option><option>圓柱</option><option>異形</option><option>板金</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>外型複雜度 (Complexity)</label>
              <select name="shapeComplexity" value={formData.shapeComplexity} onChange={handleChange} disabled={isLoading} className={selectClass}>
                <option>簡單</option><option>普通</option><option>複雜</option><option>極複雜</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>孔數 (Holes)</label>
              <input type="number" name="holeCount" value={formData.holeCount} onChange={handleChange} disabled={isLoading} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>孔深 (Depth mm)</label>
              <input type="number" name="holeDepth" value={formData.holeDepth} onChange={handleChange} disabled={isLoading} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>是否盲孔 (Blind Hole)</label>
              <select name="isBlindHole" value={formData.isBlindHole} onChange={handleChange} disabled={isLoading} className={selectClass}>
                <option>否</option><option>是</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>表面處理 (Finishing)</label>
              <select name="surfaceTreatment" value={formData.surfaceTreatment} onChange={handleChange} disabled={isLoading} className={selectClass}>
                <option>無</option><option>陽極處理</option><option>硬陽處理</option><option>染黑</option><option>噴砂</option><option>電鍍</option><option>熱處理</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>是否攻牙 (Tapping)</label>
              <select name="isTapping" value={formData.isTapping} onChange={handleChange} disabled={isLoading} className={selectClass}>
                <option>否</option><option>是</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>牙規 (Thread Spec)</label>
              <select name="threadSpec" value={formData.threadSpec} onChange={handleChange} disabled={isLoading} className={selectClass}>
                <option>無</option><option>M3</option><option>M4</option><option>M5</option><option>M6</option><option>M8</option><option>M10</option><option>M12</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>公差等級 (Tolerance)</label>
              <select name="toleranceGrade" value={formData.toleranceGrade} onChange={handleChange} disabled={isLoading} className={selectClass}>
                <option>一般 (±0.1)</option><option>精密 (±0.05)</option><option>超精密 (±0.01)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>交期 (Lead Time)</label>
              <select name="deliveryTime" value={formData.deliveryTime} onChange={handleChange} disabled={isLoading} className={selectClass}>
                <option>一般件 (14天)</option><option>急件 (7天)</option><option>特急件 (3天)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>加工方式 (Methods)</label>
              <div className="flex flex-wrap gap-2">
                {['銑削', '車削', '鑽孔', '攻牙', '研磨', '線割', '放電'].map(method => (
                  <label key={method} className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors border-2 ${formData.machiningMethods.includes(method) ? 'bg-[#E57E52] border-[#E57E52] text-[#171312]' : 'border-[#A89680]/30 text-[#A89680] hover:border-[#E57E52]/50'}`}>
                    <input type="checkbox" className="hidden" checked={formData.machiningMethods.includes(method)} onChange={() => handleCheckboxChange(method)} disabled={isLoading} />
                    {method}
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 pt-2 pb-4">
              <div className="flex justify-between items-center mb-2">
                <label className={labelClass.replace('mb-1.5', 'mb-0')}>利潤率 (Profit Margin)</label>
                <span className="text-[#E57E52] text-sm font-black bg-[#E57E52]/10 px-3 py-1 rounded-full">{formData.profitMargin}%</span>
              </div>
              <input type="range" name="profitMargin" min="0" max="100" step="5" value={formData.profitMargin} onChange={handleChange} disabled={isLoading} className="w-full h-2 bg-[#A89680]/20 rounded-lg appearance-none cursor-pointer accent-[#E57E52]" />
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
