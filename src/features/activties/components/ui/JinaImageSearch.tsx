'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { MagnifyingGlassIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { MediaItem } from './MediaUploader';

interface JinaImageSearchProps {
  onSelectImage: (media: MediaItem) => void;
  className?: string;
}

/**
 * Jina AI Image Search Component
 * 
 * This component provides an interface for searching and selecting images from Jina AI.
 * It allows users to search for images and select them for use in activities.
 */
export const JinaImageSearch: React.FC<JinaImageSearchProps> = ({
  onSelectImage,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  
  // Handle search query change
  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setError(null);
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the Jina AI API
      // For now, we'll simulate some results
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate search results
      const simulatedResults = [
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
        'https://images.unsplash.com/photo-1557682250-33bd709cbe85',
        'https://images.unsplash.com/photo-1590523278191-995cbcda646b',
        'https://images.unsplash.com/photo-1573455494060-c5595004fb6c',
        'https://images.unsplash.com/photo-1614850523060-8da1d56ae167',
        'https://images.unsplash.com/photo-1513151233558-d860c5398176'
      ];
      
      setSearchResults(simulatedResults);
    } catch (err) {
      console.error('Error searching for images:', err);
      setError('Failed to search for images. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle image selection
  const handleSelectImage = (url: string) => {
    setSelectedImageUrl(url);
    
    // Create media item
    const media: MediaItem = {
      type: 'image',
      url,
      alt: searchQuery
    };
    
    onSelectImage(media);
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchQueryChange}
          placeholder="Search for images..."
          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
        >
          {isSearching ? (
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
          ) : (
            <MagnifyingGlassIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      
      {searchResults.length > 0 && (
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Results
          </h3>
          
          <div className="grid grid-cols-3 gap-2">
            {searchResults.map((url, index) => (
              <div 
                key={index}
                className={cn(
                  "relative border rounded overflow-hidden cursor-pointer transition-all",
                  selectedImageUrl === url 
                    ? "border-blue-500 ring-2 ring-blue-500" 
                    : "border-gray-300 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                )}
                onClick={() => handleSelectImage(url)}
              >
                <img 
                  src={url} 
                  alt={`Search result ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
                {selectedImageUrl === url && (
                  <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Click on an image to select it for your activity.
          </p>
        </div>
      )}
    </div>
  );
};

export default JinaImageSearch;
