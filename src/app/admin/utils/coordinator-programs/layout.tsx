import { AdminLayout } from "@/components/layouts/admin-layout";

export default function CoordinatorProgramsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
