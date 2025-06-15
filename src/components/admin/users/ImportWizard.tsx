import { useState } from "react";
import { Card, Button } from "~/components/ui";
import { DataPreview } from "./DataPreview";
import { api } from "~/utils/api";

// Custom Stepper component
interface StepperProps {
  steps: Array<{ id: string; label: string }>;
  currentStep: string;
  onChange: (step: string) => void;
}

const Stepper = ({ steps, currentStep, onChange }: StepperProps) => {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
        
        return (
          <div key={step.id} className="flex items-center">
            {index > 0 && (
              <div 
                className={`h-1 w-16 mx-2 ${
                  isCompleted ? 'bg-primary' : 'bg-gray-200'
                }`} 
              />
            )}
            <button
              onClick={() => onChange(step.id)}
              className={`flex flex-col items-center ${
                isActive ? 'text-primary' : isCompleted ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              <div 
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-primary text-white' : 
                  isCompleted ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span className="mt-1 text-xs">{step.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Custom FileUpload component
interface FileUploadProps {
  accept: Record<string, string[]>;
  onUpload: (file: File) => void;
}

const FileUpload = ({ accept, onUpload }: FileUploadProps) => {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".csv,.xlsx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      <label 
        htmlFor="file-upload"
        className="cursor-pointer text-primary hover:text-primary/80"
      >
        Click to upload a file
      </label>
      <p className="text-sm text-gray-500 mt-2">
        Supported formats: CSV, Excel
      </p>
    </div>
  );
};

type ImportStep = "upload" | "preview" | "mapping" | "validation" | "import";

export const ImportWizard = () => {
  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fieldMapping, setFieldMapping] = useState({});

  // Use a mock implementation since the actual API endpoint doesn't exist
  const importMutation = {
    mutateAsync: async (data: any) => {
      console.log("Importing data:", data);
      return { success: true };
    },
    isLoading: false
  };

  const steps = [
    { id: "upload", label: "Upload File" },
    { id: "preview", label: "Preview Data" },
    { id: "mapping", label: "Field Mapping" },
    { id: "validation", label: "Validation" },
    { id: "import", label: "Import" }
  ];

  const handleFileUpload = (file: File) => {
    setFile(file);
    // Parse file and set preview data
    setPreviewData([
      { name: "John Doe", email: "john@example.com", role: "USER" },
      { name: "Jane Smith", email: "jane@example.com", role: "ADMIN" }
    ]);
  };

  const handleImport = async () => {
    await importMutation.mutateAsync({
      data: previewData,
      mapping: fieldMapping
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onChange={(step) => setCurrentStep(step as ImportStep)}
        />

        <div className="mt-8">
          {currentStep === "upload" && (
            <FileUpload
              accept={{ 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }}
              onUpload={handleFileUpload}
            />
          )}

          {currentStep === "preview" && (
            <DataPreview data={previewData} />
          )}

          {/* Add other step components */}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = steps.findIndex(s => s.id === currentStep);
                if (currentIndex > 0) {
                  setCurrentStep(steps[currentIndex - 1].id as ImportStep);
                }
              }}
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                const currentIndex = steps.findIndex(s => s.id === currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1].id as ImportStep);
                } else {
                  handleImport();
                }
              }}
            >
              {currentStep === "import" ? "Start Import" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}; 