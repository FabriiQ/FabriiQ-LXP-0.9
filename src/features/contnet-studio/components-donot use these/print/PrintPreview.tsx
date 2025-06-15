'use client';

/**
 * PrintPreview
 *
 * A reusable component for previewing content before printing.
 * Provides zoom controls, page navigation, and print options.
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Printer,
  Download,
  Search as ZoomIn,
  SearchX as ZoomOut,
  RefreshCw as RotateCw,
  ChevronLeft,
  ChevronRight,
  Download as FileDown,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PrintPreviewProps {
  children: React.ReactNode;
  className?: string;
  onPrint?: () => void;
  onDownload?: () => void;
  title?: string;
}

export function PrintPreview({
  children,
  className,
  onPrint,
  onDownload,
  title = 'Print Preview',
}: PrintPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  // Handle orientation change
  const handleOrientationChange = () => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
  };

  // Handle print
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  // Handle download as PDF
  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    if (!previewRef.current) return;

    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      // Create PDF with correct dimensions
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize,
      });

      // Add image to PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Save PDF
      pdf.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-card border rounded-md p-2">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <div className="text-sm font-medium w-16 text-center">
            {zoom}%
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Slider
            value={[zoom]}
            min={50}
            max={200}
            step={10}
            className="w-32"
            onValueChange={(value) => setZoom(value[0])}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleOrientationChange}
          >
            <RotateCw className="h-4 w-4 mr-1" />
            {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Options
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Print Settings</h4>

                <div className="space-y-2">
                  <Label htmlFor="page-size">Page Size</Label>
                  <Select
                    value={pageSize}
                    onValueChange={(value) => setPageSize(value as any)}
                  >
                    <SelectTrigger id="page-size">
                      <SelectValue placeholder="Select page size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="page-numbers">Show Page Numbers</Label>
                  <Switch
                    id="page-numbers"
                    checked={showPageNumbers}
                    onCheckedChange={setShowPageNumbers}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <FileDown className="h-4 w-4 mr-1" />
            Download PDF
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="bg-gray-100 p-8 rounded-md overflow-auto min-h-[500px] flex justify-center">
        <div
          ref={previewRef}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-in-out',
          }}
        >
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, {
                orientation,
                pageSize,
                showPageNumbers,
              });
            }
            return child;
          })}
        </div>
      </div>
    </div>
  );
}
