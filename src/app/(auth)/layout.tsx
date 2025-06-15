'use client';

import { ReactNode, useState, useEffect } from "react";
import { Logo } from '@/components/ui/logo';

interface AuthLayoutProps {
  children: ReactNode;
}

interface Quote {
  text: string;
  author: string;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  // Inspirational quotes for education/learning
  const quotes = [
    {
      text: "Education is not preparation for life; education is life itself.",
      author: "John Dewey"
    },
    {
      text: "The roots of education are bitter, but the fruit is sweet.",
      author: "Aristotle"
    },
    {
      text: "The whole purpose of education is to turn mirrors into windows.",
      author: "Sydney J. Harris"
    }
  ];

  // Initialize with the first quote to avoid hydration errors
  const [quote, setQuote] = useState<Quote>(quotes[0]);
  
  // Select a random quote only on the client side to avoid hydration errors
  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Login Form */}
      <div className="w-full md:w-1/2 bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {children}
        </div>
      </div>
      
      {/* Right side - Gradient Background and Quote (hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-800 to-primary-950 flex-col justify-center items-center relative overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 z-0 opacity-15 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJ3aGl0ZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoLTR2LTJoNHYtNGgydjRoNHYyaC00djR6Ii8+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIvPjwvZz48L3N2Zz4=')]"></div>
        
        {/* Content container with enhanced visibility */}
        <div className="z-10 max-w-md p-8 text-white text-center">
          <div className="mb-8">
            <Logo className="mx-auto" showTagline={true} />
          </div>
          
          {/* Quote container with dark grey background */}
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700">
            <blockquote className="text-2xl font-medium italic mb-4 leading-relaxed text-primary-500 drop-shadow-md">
              "{quote.text}"
            </blockquote>
            <div className="w-16 h-1 bg-primary-400 mx-auto my-5"></div>
            <cite className="text-base font-light text-primary-200 block">— {quote.author}</cite>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-24 h-24 rounded-full bg-primary-600/30 blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-primary-500/30 blur-xl"></div>
        </div>
      </div>
    </div>
  );
} 