"use client";

import { redirect } from "next/navigation";
import { useParams } from "next/navigation";

export default function WorksheetDetailRedirect() {
  const params = useParams();
  const id = params.id as string;

  redirect(`/teacher/content-studio/${id}`);
}
