import { Card } from "~/components/ui";
import { Badge } from "~/components/ui/data-display/badge";
import { useState, useEffect } from "react";

// Define the audit log item type
interface AuditLogItem {
  id: string;
  timestamp: string | Date;
  action: string;
  before: any;
  after: any;
  impact: Array<{
    title: string;
    description: string;
  }>;
}

// Define a custom Timeline component since it's not available in the UI components
const Timeline = ({ items }: { items: any[] }) => {
  if (!items || items.length === 0) {
    return <p>No impact data available</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex">
          <div className="mr-4 flex flex-col items-center">
            <div className="h-4 w-4 rounded-full bg-primary"></div>
            {index < items.length - 1 && <div className="h-full w-0.5 bg-gray-200"></div>}
          </div>
          <div className="pb-4">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-gray-500">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

type AuditDetailProps = {
  auditId: string;
};

// Mock data for demonstration purposes
const mockAuditData: Record<string, AuditLogItem> = {
  "audit-1": {
    id: "audit-1",
    timestamp: new Date(),
    action: "UPDATE",
    before: { name: "Old Name", status: "ACTIVE" },
    after: { name: "New Name", status: "ACTIVE" },
    impact: [
      { title: "User Permissions", description: "No impact on user permissions" },
      { title: "System Access", description: "No changes to system access" }
    ]
  }
};

export const AuditDetail = ({ auditId }: AuditDetailProps) => {
  const [audit, setAudit] = useState<AuditLogItem | null>(null);
  
  useEffect(() => {
    // In a real implementation, this would be an API call
    // For now, we'll use mock data
    if (auditId) {
      // Simulate API call delay
      const timer = setTimeout(() => {
        setAudit(mockAuditData[auditId] || mockAuditData["audit-1"]);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [auditId]);

  if (!audit) return <div className="p-6">Loading...</div>;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">Change Details</h3>
            <p className="text-sm text-gray-500">
              {new Date(audit.timestamp).toLocaleString()}
            </p>
          </div>
          <Badge variant="outline">{audit.action}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Before</h4>
            <pre className="bg-gray-50 p-2 rounded">
              {JSON.stringify(audit.before, null, 2)}
            </pre>
          </Card>
          <Card className="p-4">
            <h4 className="font-medium mb-2">After</h4>
            <pre className="bg-gray-50 p-2 rounded">
              {JSON.stringify(audit.after, null, 2)}
            </pre>
          </Card>
        </div>

        <div>
          <h4 className="font-medium mb-2">Impact Analysis</h4>
          <Timeline items={audit.impact || []} />
        </div>
      </div>
    </Card>
  );
}; 