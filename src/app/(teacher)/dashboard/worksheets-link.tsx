"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText } from "lucide-react";

export default function WorksheetsLink() {
  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-2">Worksheets</h3>
      <p className="text-muted-foreground mb-4">
        Create and manage AI-powered worksheets for your classes
      </p>
      <Button asChild>
        <Link href="/worksheets">
          <FileText className="mr-2 h-4 w-4" />
          Go to Worksheets
        </Link>
      </Button>
    </div>
  );
}
