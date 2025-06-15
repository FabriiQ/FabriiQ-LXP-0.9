import { useEffect, useRef } from 'react';
import { Tree } from 'react-d3-tree';
import { Card } from "~/components/ui";
import { Badge } from "~/components/ui/data-display/badge";

type PermissionInheritanceProps = {
  roleId: string;
};

// Define the inheritance node type
interface InheritanceNode {
  name: string;
  type: string;
  inherited: boolean;
  children?: InheritanceNode[];
}

// Mock inheritance data
const mockInheritanceData: Record<string, InheritanceNode> = {
  "role-1": {
    name: "Admin",
    type: "ROLE",
    inherited: false,
    children: [
      {
        name: "User Management",
        type: "PERMISSION_GROUP",
        inherited: false,
        children: [
          { name: "Create User", type: "PERMISSION", inherited: false },
          { name: "Edit User", type: "PERMISSION", inherited: false },
          { name: "Delete User", type: "PERMISSION", inherited: false }
        ]
      },
      {
        name: "Content Management",
        type: "PERMISSION_GROUP",
        inherited: true,
        children: [
          { name: "Create Content", type: "PERMISSION", inherited: true },
          { name: "Edit Content", type: "PERMISSION", inherited: true }
        ]
      }
    ]
  }
};

export const PermissionInheritance = ({ roleId }: PermissionInheritanceProps) => {
  const treeContainer = useRef<HTMLDivElement>(null);
  
  // Use mock data instead of API call
  const inheritance = mockInheritanceData[roleId] || mockInheritanceData["role-1"];

  const buildTreeData = () => {
    if (!inheritance) return { name: 'No inheritance data' };

    const buildNode = (node: InheritanceNode): any => ({
      name: node.name,
      attributes: {
        type: node.type,
        inherited: node.inherited
      },
      children: (node.children || []).map(buildNode)
    });

    return buildNode(inheritance);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Permission Inheritance</h3>
      <div ref={treeContainer} style={{ width: '100%', height: '400px' }}>
        <Tree
          data={buildTreeData()}
          orientation="vertical"
          pathFunc="step"
          translate={{ 
            x: treeContainer.current?.clientWidth ? treeContainer.current.clientWidth / 2 : 0,
            y: 50 
          }}
          renderCustomNodeElement={({ nodeDatum }: { nodeDatum: any }) => (
            <g>
              <circle r={10} fill="#555" />
              <text dy="20" textAnchor="middle">
                {nodeDatum.name}
              </text>
              {nodeDatum.attributes?.inherited && (
                <g transform="translate(0, 30)">
                  <rect width={70} height={20} rx={4} fill="#f3f4f6" />
                  <text x={35} y={14} fontSize={10} textAnchor="middle" fill="#6b7280">
                    Inherited
                  </text>
                </g>
              )}
            </g>
          )}
        />
      </div>
    </Card>
  );
}; 