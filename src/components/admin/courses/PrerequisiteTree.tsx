import { useRef } from 'react';
import { Tree } from 'react-d3-tree';
import { Card } from "~/components/ui";
import { api } from "~/utils/api";

type PrerequisiteTreeProps = {
  prerequisites: string[];
};

// Define the course type
interface Course {
  id: string;
  code: string;
  name: string;
  // Add other properties as needed
}

// Define the tree node type
interface TreeNode {
  name: string;
  attributes: {
    name: string;
  };
  children: TreeNode[];
}

export const PrerequisiteTree = ({ prerequisites }: PrerequisiteTreeProps) => {
  const treeContainer = useRef<HTMLDivElement>(null);
  const { data } = api.course.list.useQuery({});

  const buildTreeData = (): TreeNode | { name: string } => {
    // Early return if no data or prerequisites
    if (!data?.courses || prerequisites.length === 0) {
      return { name: 'No prerequisites' };
    }

    // Create a map of courses by ID for quick lookup
    const courseMap = new Map<string, Course>();
    data.courses.forEach((course: any) => {
      courseMap.set(course.id, {
        id: course.id,
        code: course.code,
        name: course.name
      });
    });

    // Find the root course (first prerequisite)
    const rootId = prerequisites[0];
    const rootCourse = courseMap.get(rootId);

    if (!rootCourse) {
      return { name: 'No prerequisites' };
    }

    // Build the tree recursively
    const buildNode = (courseId: string, visited: Set<string> = new Set()): TreeNode | null => {
      // Prevent circular references
      if (visited.has(courseId)) {
        return null;
      }
      
      // Mark this course as visited
      visited.add(courseId);
      
      // Get the course from our map
      const course = courseMap.get(courseId);
      if (!course) {
        return null;
      }
      
      // Find child prerequisites (excluding the current course and already visited ones)
      const childIds = prerequisites.filter(id => 
        id !== courseId && !visited.has(id)
      );
      
      // Build child nodes
      const children: TreeNode[] = [];
      childIds.forEach(id => {
        const childNode = buildNode(id, new Set(visited));
        if (childNode) {
          children.push(childNode);
        }
      });
      
      // Return the node
      return {
        name: course.code,
        attributes: {
          name: course.name
        },
        children
      };
    };

    // Start building from the root
    const rootNode = buildNode(rootId);
    return rootNode || { name: 'No prerequisites' };
  };

  return (
    <Card className="p-4">
      <div ref={treeContainer} style={{ width: '100%', height: '300px' }}>
        <Tree 
          data={buildTreeData()}
          orientation="vertical"
          pathFunc="step"
          translate={{ 
            x: treeContainer.current?.clientWidth ? treeContainer.current.clientWidth / 2 : 0, 
            y: 50 
          }}
        />
      </div>
    </Card>
  );
}; 