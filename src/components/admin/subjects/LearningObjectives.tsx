import { useState } from 'react';
import { Card } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/core/button";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2 } from "lucide-react";

type Objective = {
  id: string;
  description: string;
  assessmentCriteria: string;
};

type LearningObjectivesProps = {
  subjectId: string;
  initialObjectives?: Objective[];
};

export const LearningObjectives = ({ subjectId, initialObjectives = [] }: LearningObjectivesProps) => {
  const [objectives, setObjectives] = useState<Objective[]>(initialObjectives);
  const router = useRouter();

  const handleDeleteObjective = (id: string) => {
    setObjectives(objectives.filter(obj => obj.id !== id));
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Learning Objectives</h3>
        <Button onClick={() => router.push(`/admin/system/subjects/${subjectId}/objectives/add`)}>
          Add Objective
        </Button>
      </div>

      <div className="space-y-4">
        {objectives.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No learning objectives defined yet. Add an objective to get started.
          </div>
        ) : (
          objectives.map((objective, index) => (
            <div key={objective.id} className="p-4 border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Objective {index + 1}</h4>
                  <p className="mt-1">{objective.description}</p>
                  <div className="mt-2">
                    <h5 className="text-sm font-medium text-gray-500">Assessment Criteria</h5>
                    <p className="text-sm">{objective.assessmentCriteria}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/admin/system/subjects/${subjectId}/objectives/${objective.id}/edit`)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteObjective(objective.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};