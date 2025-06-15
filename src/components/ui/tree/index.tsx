import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { cn } from '~/lib/utils';

export interface TreeItem {
  id: string;
  name: string;
  children?: TreeItem[];
  [key: string]: any;
}

interface TreeProps {
  items: TreeItem[];
  onMove?: (dragId: string, dropId: string) => void;
  onSelect?: (item: TreeItem) => void;
  renderItem?: (item: TreeItem, isExpanded: boolean, level: number) => React.ReactNode;
  className?: string;
  dragType?: string;
}

export const Tree: React.FC<TreeProps> = ({
  items,
  onMove,
  onSelect,
  renderItem,
  className,
  dragType = 'TREE_ITEM',
}) => {
  return (
    <div className={cn("w-full", className)}>
      {items?.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          onMove={onMove}
          onSelect={onSelect}
          renderItem={renderItem}
          level={0}
          dragType={dragType}
        />
      ))}
    </div>
  );
};

interface TreeNodeProps {
  item: TreeItem;
  level: number;
  onMove?: (dragId: string, dropId: string) => void;
  onSelect?: (item: TreeItem) => void;
  renderItem?: (item: TreeItem, isExpanded: boolean, level: number) => React.ReactNode;
  dragType: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  item,
  level,
  onMove,
  onSelect,
  renderItem,
  dragType,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: dragType,
    item: () => ({ id: item.id }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: dragType,
    drop: (draggedItem: { id: string }) => {
      if (draggedItem.id !== item.id && onMove) {
        onMove(draggedItem.id, item.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Combine drag and drop refs
  drag(drop(ref));

  const hasChildren = item.children && item.children.length > 0;

  const toggleExpand = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <div className={cn("transition-opacity", isDragging ? "opacity-50" : "opacity-100")}>
      <div
        ref={ref}
        className={cn(
          "flex items-center p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors",
          isOver && "bg-blue-50 dark:bg-blue-900/20"
        )}
        onClick={handleSelect}
      >
        {renderItem ? (
          renderItem(item, isExpanded, level)
        ) : (
          <div className="flex items-center w-full">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand();
                }}
                className="mr-2 w-4 h-4 flex items-center justify-center"
              >
                {isExpanded ? "−" : "+"}
              </button>
            )}
            <span className="ml-2">{item.name}</span>
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-6 border-l border-gray-200 dark:border-gray-700 pl-2 mt-1">
          {item.children!.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              onMove={onMove}
              onSelect={onSelect}
              renderItem={renderItem}
              dragType={dragType}
            />
          ))}
        </div>
      )}
    </div>
  );
};
