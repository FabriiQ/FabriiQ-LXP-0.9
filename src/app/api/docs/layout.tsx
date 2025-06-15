import { TRPCProvider } from "../../../trpc/provider";

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </TRPCProvider>
  );
} 