import { useState } from 'react';
import { QuoteForm } from './components/QuoteForm';
import { QuoteResult } from './components/QuoteResult';
import type { QuoteResponse } from './types';

function App() {
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);

  const handleReset = () => {
    setQuoteData(null);
  };

  return (
    <div className="min-h-screen bg-[#171312] text-[#171312] font-sans p-4 sm:p-8 flex items-center justify-center selection:bg-[#E57E52] selection:text-[#f1ead9]">
      <div className="w-full max-w-5xl space-y-4">
        {!quoteData ? (
          <QuoteForm onQuoteReceived={setQuoteData} />
        ) : (
          <QuoteResult data={quoteData} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

export default App;
