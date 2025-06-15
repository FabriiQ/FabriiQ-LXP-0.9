'use client';

import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Card } from '@/components/ui/atoms/custom-card';
import { SearchBar } from '@/components/ui/search-bar';
import { useState } from 'react';

export default function DesignSystemPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Search query:', query);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1>AIVY LXP Design System</h1>
      
      <section className="mt-xxl">
        <h2>Typography</h2>
        <div className="mt-lg grid gap-md">
          <div>
            <h1>Heading 1 (48px)</h1>
            <p className="text-muted-foreground">Used for main page headings</p>
          </div>
          <div>
            <h2>Heading 2 (36px)</h2>
            <p className="text-muted-foreground">Used for section headings</p>
          </div>
          <div>
            <h3>Heading 3 (24px)</h3>
            <p className="text-muted-foreground">Used for subsection headings</p>
          </div>
          <div>
            <h4>Heading 4 (20px)</h4>
            <p className="text-muted-foreground">Used for card headings</p>
          </div>
          <div>
            <p className="body-large">Body Large (18px)</p>
            <p className="text-muted-foreground">Used for featured content</p>
          </div>
          <div>
            <p className="body">Body (16px)</p>
            <p className="text-muted-foreground">Used for main content</p>
          </div>
          <div>
            <p className="body-small">Body Small (14px)</p>
            <p className="text-muted-foreground">Used for secondary content</p>
          </div>
          <div>
            <p className="caption">Caption (12px)</p>
            <p className="text-muted-foreground">Used for labels and metadata</p>
          </div>
        </div>
      </section>
      
      <section className="mt-xxl">
        <h2>Colors</h2>
        
        <h3 className="mt-lg">Brand Colors</h3>
        <div className="mt-md grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="p-md bg-primary-green text-white rounded-md">Primary Green (#1F504B)</div>
          <div className="p-md bg-medium-teal text-white rounded-md">Medium Teal (#5A8A84)</div>
          <div className="p-md bg-light-mint text-primary-green rounded-md">Light Mint (#D8E3E0)</div>
        </div>
        
        <h3 className="mt-lg">Neutral Colors</h3>
        <div className="mt-md grid grid-cols-1 md:grid-cols-5 gap-md">
          <div className="p-md bg-white text-black border border-medium-gray rounded-md">White (#FFFFFF)</div>
          <div className="p-md bg-light-gray text-black rounded-md">Light Gray (#F5F5F5)</div>
          <div className="p-md bg-medium-gray text-black rounded-md">Medium Gray (#E0E0E0)</div>
          <div className="p-md bg-dark-gray text-white rounded-md">Dark Gray (#757575)</div>
          <div className="p-md bg-black text-white rounded-md">Black (#212121)</div>
        </div>
        
        <h3 className="mt-lg">State Colors</h3>
        <div className="mt-md grid grid-cols-1 md:grid-cols-5 gap-md">
          <div className="p-md bg-red text-white rounded-md">Red (#D92632)</div>
          <div className="p-md bg-orange text-black rounded-md">Orange (#FF9852)</div>
          <div className="p-md bg-purple text-white rounded-md">Purple (#6126AE)</div>
          <div className="p-md bg-dark-blue text-white rounded-md">Dark Blue (#004EB2)</div>
          <div className="p-md bg-light-blue text-white rounded-md">Light Blue (#2F96F4)</div>
        </div>
      </section>
      
      <section className="mt-xxl">
        <h2>Role-Based Themes</h2>
        <div className="mt-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          <div className="theme-system-admin">
            <Card 
              title="System Admin Theme" 
              subtitle="Primary: Green, Secondary: Teal, Accent: Dark Blue"
              variant="bordered"
            >
              <div className="grid gap-md">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Primary Button</button>
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md">Secondary Button</button>
                <div className="p-md bg-accent text-accent-foreground rounded-md">Accent Background</div>
              </div>
            </Card>
          </div>
          
          <div className="theme-campus-admin">
            <Card 
              title="Campus Admin Theme" 
              subtitle="Primary: Dark Blue, Secondary: Light Blue, Accent: Green"
              variant="bordered"
            >
              <div className="grid gap-md">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Primary Button</button>
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md">Secondary Button</button>
                <div className="p-md bg-accent text-accent-foreground rounded-md">Accent Background</div>
              </div>
            </Card>
          </div>
          
          <div className="theme-teacher">
            <Card 
              title="Teacher Theme" 
              subtitle="Primary: Teal, Secondary: Green, Accent: Light Blue"
              variant="bordered"
            >
              <div className="grid gap-md">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Primary Button</button>
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md">Secondary Button</button>
                <div className="p-md bg-accent text-accent-foreground rounded-md">Accent Background</div>
              </div>
            </Card>
          </div>
          
          <div className="theme-student">
            <Card 
              title="Student Theme" 
              subtitle="Primary: Light Blue, Secondary: Dark Blue, Accent: Orange"
              variant="bordered"
            >
              <div className="grid gap-md">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Primary Button</button>
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md">Secondary Button</button>
                <div className="p-md bg-accent text-accent-foreground rounded-md">Accent Background</div>
              </div>
            </Card>
          </div>
          
          <div className="theme-parent">
            <Card 
              title="Parent Theme" 
              subtitle="Primary: Purple, Secondary: Teal, Accent: Orange"
              variant="bordered"
            >
              <div className="grid gap-md">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Primary Button</button>
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md">Secondary Button</button>
                <div className="p-md bg-accent text-accent-foreground rounded-md">Accent Background</div>
              </div>
            </Card>
          </div>
        </div>
      </section>
      
      <section className="mt-xxl">
        <h2>Components</h2>
        
        <h3 className="mt-lg">Search Bars</h3>
        <div className="mt-md grid gap-lg">
          <div>
            <p className="mb-sm font-medium">Default Search Bar</p>
            <SearchBar 
              placeholder="Search..." 
              onSearch={handleSearch}
              variant="default"
            />
          </div>
          
          <div>
            <p className="mb-sm font-medium">Minimal Search Bar</p>
            <SearchBar 
              placeholder="Search..." 
              onSearch={handleSearch}
              variant="minimal"
            />
          </div>
          
          <div>
            <p className="mb-sm font-medium">Expanded Search Bar</p>
            <SearchBar 
              placeholder="Search..." 
              onSearch={handleSearch}
              variant="expanded"
            />
          </div>
        </div>
        
        <h3 className="mt-xl">Cards</h3>
        <div className="mt-md grid grid-cols-1 md:grid-cols-2 gap-lg">
          <Card 
            title="Default Card" 
            subtitle="Basic card with border"
            variant="default"
            footer={<div className="flex justify-end"><button className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm">Action</button></div>}
          >
            <p>This is the default card style with a simple border.</p>
          </Card>
          
          <Card 
            title="Bordered Card" 
            subtitle="Card with primary color border"
            variant="bordered"
            footer={<div className="flex justify-end"><button className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm">Action</button></div>}
          >
            <p>This card has a more prominent border using the primary color.</p>
          </Card>
          
          <Card 
            title="Elevated Card" 
            subtitle="Card with shadow elevation"
            variant="elevated"
            footer={<div className="flex justify-end"><button className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm">Action</button></div>}
          >
            <p>This card has a shadow to create a sense of elevation.</p>
          </Card>
          
          <Card 
            title="Flat Card" 
            subtitle="Card with muted background"
            variant="flat"
            footer={<div className="flex justify-end"><button className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm">Action</button></div>}
          >
            <p>This card has a flat design with a muted background color.</p>
          </Card>
        </div>
      </section>
      
      <section className="mt-xxl">
        <h2>Spacing</h2>
        <div className="mt-lg grid grid-cols-1 md:grid-cols-3 gap-lg">
          <div>
            <p className="mb-sm font-medium">Extra Small (4px)</p>
            <div className="bg-light-mint p-xs border border-dashed border-primary-green">
              <div className="bg-primary-green h-8 w-full"></div>
            </div>
          </div>
          
          <div>
            <p className="mb-sm font-medium">Small (8px)</p>
            <div className="bg-light-mint p-sm border border-dashed border-primary-green">
              <div className="bg-primary-green h-8 w-full"></div>
            </div>
          </div>
          
          <div>
            <p className="mb-sm font-medium">Medium (16px)</p>
            <div className="bg-light-mint p-md border border-dashed border-primary-green">
              <div className="bg-primary-green h-8 w-full"></div>
            </div>
          </div>
          
          <div>
            <p className="mb-sm font-medium">Large (24px)</p>
            <div className="bg-light-mint p-lg border border-dashed border-primary-green">
              <div className="bg-primary-green h-8 w-full"></div>
            </div>
          </div>
          
          <div>
            <p className="mb-sm font-medium">Extra Large (32px)</p>
            <div className="bg-light-mint p-xl border border-dashed border-primary-green">
              <div className="bg-primary-green h-8 w-full"></div>
            </div>
          </div>
          
          <div>
            <p className="mb-sm font-medium">Extra Extra Large (48px)</p>
            <div className="bg-light-mint p-xxl border border-dashed border-primary-green">
              <div className="bg-primary-green h-8 w-full"></div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mt-xxl">
        <h2>Border Radius</h2>
        <div className="mt-lg grid grid-cols-1 md:grid-cols-4 gap-lg">
          <div>
            <p className="mb-sm font-medium">Small (4px)</p>
            <div className="bg-primary-green h-16 w-full rounded-sm"></div>
          </div>
          
          <div>
            <p className="mb-sm font-medium">Medium (8px)</p>
            <div className="bg-primary-green h-16 w-full rounded-md"></div>
          </div>
          
          <div>
            <p className="mb-sm font-medium">Large (12px)</p>
            <div className="bg-primary-green h-16 w-full rounded-lg"></div>
          </div>
          
          <div>
            <p className="mb-sm font-medium">Round (50%)</p>
            <div className="bg-primary-green h-16 w-16 rounded-round"></div>
          </div>
        </div>
      </section>
      
      <section className="mt-xxl mb-xxl">
        <h2>Animations</h2>
        <div className="mt-lg grid grid-cols-1 md:grid-cols-3 gap-lg">
          <div>
            <p className="mb-sm font-medium">Fade In</p>
            <div className="animate-fade-in bg-primary-green h-16 w-full rounded-md"></div>
          </div>
          
          <div>
            <p className="mb-sm font-medium">Hover Scale</p>
            <div className="transition-default hover:scale-105 bg-primary-green h-16 w-full rounded-md"></div>
          </div>
          
          <div>
            <p className="mb-sm font-medium">Shake</p>
            <div className="animate-shake bg-primary-green h-16 w-full rounded-md"></div>
          </div>
        </div>
      </section>
    </div>
  );
} 