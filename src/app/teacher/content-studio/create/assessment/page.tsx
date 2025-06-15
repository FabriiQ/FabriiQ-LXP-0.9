"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssessmentRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/teacher/content-studio/create/assessment/type");
  }, [router]);

  return (
    <div className="container py-6 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
