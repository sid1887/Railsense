/**
 * Enhanced Train Search Component
 * Features: Autocomplete, recent searches, suggestions, loading state
 */
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import mockTrainData from '@/public/mockTrainData.json';

const TRAINS = [
  { number: '12728', name: 'Godavari Express' },
  { number: '12955', name: 'Somnath Express' },
  { number: '17015', name: 'Visakha Express' },
  { number: '12702', name: 'Kazipet-Warangal Express' },
  { number: '11039', name: 'Coromandel Express' },
];

interface SearchSuggestion {
  number: string;
  name: string;
  type: 'recent' | 'suggested';
}

export const EnhancedSearchComponent: React.FC = () => {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentTrainSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Handle input changes and filtering
  useEffect(() => {
    if (!input.trim()) {
      // Show recent searches when input is empty
      setSuggestions(recentSearches);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const query = input.toLowerCase();
      const filtered = TRAINS.filter(
        (train) =>
          train.number.includes(query) ||
          train.name.toLowerCase().includes(query)
      ).map((train) => ({
        number: train.number,
        name: train.name,
        type: 'suggested' as const,
      }));

      setSuggestions(filtered);
      setIsLoading(false);
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [input, recentSearches]);

  const handleSelectTrain = (trainNumber: string, trainName: string) => {
    // Add to recent searches
    const newRecent = [
      { number: trainNumber, name: trainName, type: 'recent' as const },
      ...recentSearches.filter((s) => s.number !== trainNumber),
    ].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentTrainSearches', JSON.stringify(newRecent));

    // Navigate to train detail page
    router.push(`/train/${trainNumber}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      handleSelectTrain(suggestions[0].number, suggestions[0].name);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input Container with Glassmorphism */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-blue to-accent-cyan opacity-20 rounded-xl blur-lg group-hover:opacity-40 transition-opacity" />
        <div className="relative bg-dark-card backdrop-blur-xl bg-opacity-50 border border-accent-blue border-opacity-30 rounded-xl p-4 hover:border-opacity-50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-accent-blue flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by train number or name (e.g., 12702 or Coromandel)"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white placeholder-text-secondary outline-none text-lg"
            />
            {isLoading && (
              <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Loading Shimmer State */}
          {isLoading && (
            <div className="mt-2 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-gray-700 rounded animate-shimmer" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-dark-card border border-accent-blue border-opacity-30 rounded-xl overflow-hidden z-50 shadow-2xl shadow-accent-blue/20">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectTrain(suggestion.number, suggestion.name)}
              className="px-4 py-3 border-b border-dark-bg last:border-b-0 hover:bg-dark-bg cursor-pointer transition-colors duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-accent-blue group-hover:text-accent-cyan transition-colors">
                    {suggestion.number}
                  </div>
                  <div className="text-xs text-text-secondary">{suggestion.name}</div>
                </div>
                {suggestion.type === 'recent' && (
                  <span className="text-xs px-2 py-1 bg-accent-blue bg-opacity-20 text-accent-blue rounded">Recent</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Searches Fallback */}
      {input === '' && recentSearches.length > 0 && showSuggestions && (
        <div className="absolute top-full mt-2 w-full bg-dark-card border border-accent-blue border-opacity-30 rounded-xl overflow-hidden z-50 shadow-2xl shadow-accent-blue/20">
          <div className="px-4 py-2 text-xs text-text-secondary font-semibold uppercase tracking-wider bg-dark-bg">
            Recent Searches
          </div>
          {recentSearches.map((search, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectTrain(search.number, search.name)}
              className="px-4 py-3 border-b border-dark-bg last:border-b-0 hover:bg-dark-bg cursor-pointer transition-colors duration-200 group"
            >
              <div className="text-sm font-semibold text-accent-blue group-hover:text-accent-cyan transition-colors">
                {search.number} - {search.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside handler */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => setShowSuggestions(false)}
      />

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .animate-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};
