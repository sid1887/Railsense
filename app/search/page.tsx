/**
 * Advanced Train Search Page
 * Combined filtering, sorting, and results display
 */

import { Suspense } from 'react';
import { SearchPageContent } from './SearchPageContent';

function SearchPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-card p-4 md:p-8 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-accent-blue border-t-accent-blue-dark rounded-full animate-spin"></div>
        <p className="text-text-secondary">Loading search...</p>
      </div>
    </div>
  );
}

export default function AdvancedSearchPage() {
  return (
    <Suspense fallback={<SearchPageLoading />}>
      <SearchPageContent />
    </Suspense>
  );
}
