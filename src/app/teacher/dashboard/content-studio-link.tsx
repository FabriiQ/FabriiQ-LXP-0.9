"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";

export default function ContentStudioLink() {
  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-2">AI Content Studio</h3>
      <p className="text-muted-foreground mb-4">
        Create AI-powered activities, assessments, and worksheets for your classes
      </p>
      <Button asChild>
        <Link href="/teacher/ai-studio" className="flex items-center">
          <Sparkles className="mr-2 h-4 w-4" />
          Open Content Studio
        </Link>
      </Button>
    </div>
  );
}
