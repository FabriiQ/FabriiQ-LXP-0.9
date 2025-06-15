"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/trpc/react";
import { ChevronLeft, Save, Eye, Copy, Trash, Plus, MoreVertical, Settings, LayoutGrid, GripVertical, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  MouseSensor,
  TouchSensor
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

// Form schema for challan template
const challanTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  copies: z.number().min(1).max(3).default(3),
  institutionLogo: z.string().optional(),
  institutionName: z.string().min(1, "Institution name is required"),
  campusName: z.string().optional(),
  campusAddress: z.string().optional(),
  campusPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  kuickpayPrefix: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankCollectionAccount: z.string().optional(),
  footerText: z.string().optional(),
  bankDetails: z.boolean().default(true),
  showStudentPhoto: z.boolean().default(false),
  showBarcode: z.boolean().default(true),
  showQRCode: z.boolean().default(true),
  showDueDate: z.boolean().default(true),
  showPaymentInstructions: z.boolean().default(true),
  paymentInstructions: z.array(z.string()).default([
    "How to Pay (Use Numeric of undermentioned)",
    "Kuickpay Prefix+Challan No= Kuickpay ID",
    "Additional Fee of Rs500/- will be charged after Due Date",
    "RS.100/WILL BE CHARGED FOR DUPLICATE FEE CHALLAN",
    "Rs.30 will be charged for Online Payment via Kuickpay"
  ]),
  components: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["text", "field", "table", "image", "line", "box"]),
      label: z.string().optional(),
      value: z.string().optional(),
      x: z.number().default(0),
      y: z.number().default(0),
      width: z.number().default(100),
      height: z.number().default(30),
      fontSize: z.number().default(12),
      fontWeight: z.enum(["normal", "bold"]).default("normal"),
      alignment: z.enum(["left", "center", "right"]).default("left"),
      field: z.string().optional(),
      isDraggable: z.boolean().default(true),
    })
  ).default([]),
});

type ChallanTemplateFormValues = z.infer<typeof challanTemplateSchema>;

// Function to generate challan data based on student fee data or use sample data
const getChallanData = (studentFeeData: any = null, formValues: any = null) => {
  // Default sample data
  const defaultData = {
    challanNo: "R-006466",
    kuickpayPrefix: "13330",
    issueDate: new Date().toLocaleDateString(),
    dueDate: "10th OF MAY, 2025",
    monthFrom: "May",
    monthTo: "May",
    year: "2025",
    refNo: "PKLHRDM250227",
    student: {
      id: "STD001",
      name: "ARFA NAZIR",
      fatherName: "MUHAMMAD KASHIF IMRAN",
      rollNo: "2023-CS-101",
      photo: "/placeholder-student.jpg",
    },
    class: {
      id: "CLS001",
      name: "Class I",
    },
    institution: {
      id: "INST001",
      name: formValues?.institutionName || "Allied School Ferozpur Road",
      campus: formValues?.campusName || "Campus (Girls Branch)",
      address: formValues?.campusAddress || "19 km Ferozpur Road Lahore",
      phone: formValues?.campusPhone || "",
      whatsapp: formValues?.whatsappNumber || "03364015028",
      logo: "/logo.png",
    },
    fee: {
      components: [
        { name: "TUITION FEE", amount: 5000 },
        { name: "LIBRARY FEE", amount: 1000 },
        { name: "COMPUTER LAB", amount: 1500 },
        { name: "SPORTS FEE", amount: 800 },
        { name: "MISC", amount: 500 },
      ],
      total: 8800,
      arrears: 0,
      grossTotal: 8800,
      siblingDiscount: 0,
      netPayable: 8800,
      amountInWords: "EIGHT THOUSAND EIGHT HUNDRED ONLY",
    },
    bank: {
      name: formValues?.bankName || "Bank AL Habib Limited",
      creditAccount: formValues?.bankAccountNumber || "0099-0981-0074-4601-6",
      collectionAccount: formValues?.bankCollectionAccount || "0099-0980-0047-4601-5",
      branch: "Main Branch, Lahore",
      processingInstructions: "BankIslami Pakistan Limited (All Branches) Transaction to be Processed via LinkIslami Only",
    },
    paymentInstructions: formValues?.paymentInstructions || [
      "How to Pay (Use Numeric of undermentioned)",
      "Kuickpay Prefix+Challan No= Kuickpay ID 13330+001234=13320001234",
      "Additional Fee of Rs500/- will be charged after Due Date",
      "RS.100/WILL BE CHARGED FOR DUPLICATE FEE CHALLAN",
      "Rs.30 will be charged for Online Payment via Kuickpay"
    ],
    copyLabels: ["Original-1", "Copy-2", "Copy-3"]
  };

  // If no student fee data, return default
  if (!studentFeeData) return defaultData;

  try {
    // Extract student data
    const student = studentFeeData.enrollment?.student;
    const classData = studentFeeData.enrollment?.class;
    const campus = classData?.courseCampus?.campus;
    const institution = campus?.institution;

    // Extract fee components
    const feeComponents = studentFeeData.feeStructure?.components || [];
    const mappedComponents = feeComponents.map((component: any) => ({
      name: component.name,
      amount: component.amount
    }));

    // Calculate totals
    const baseAmount = studentFeeData.baseAmount || 0;
    const discountedAmount = studentFeeData.discountedAmount || baseAmount;
    const finalAmount = studentFeeData.finalAmount || discountedAmount;

    // Extract discounts
    const discounts = studentFeeData.discounts || [];
    const totalDiscount = discounts.reduce((sum: number, discount: any) => sum + discount.amount, 0);

    // Extract additional charges
    const additionalCharges = studentFeeData.additionalCharges || [];
    const totalCharges = additionalCharges.reduce((sum: number, charge: any) => sum + charge.amount, 0);

    // Extract arrears
    const arrears = studentFeeData.arrears || [];
    const totalArrears = arrears.reduce((sum: number, arrear: any) => sum + arrear.amount, 0);

    // Format the amount in words
    const amountInWords = finalAmount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).replace('PKR', '').trim().toUpperCase() + " ONLY";

    // Return the dynamic data
    return {
      ...defaultData,
      challanNo: `CH-${Date.now().toString().slice(-6)}`,
      issueDate: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      refNo: studentFeeData.id || defaultData.refNo,
      student: {
        id: student?.id || defaultData.student.id,
        name: student?.user?.name || defaultData.student.name,
        fatherName: student?.fatherName || defaultData.student.fatherName,
        rollNo: student?.rollNo || defaultData.student.rollNo,
        photo: student?.user?.image || defaultData.student.photo,
      },
      class: {
        id: classData?.id || defaultData.class.id,
        name: classData?.name || defaultData.class.name,
      },
      institution: {
        id: institution?.id || defaultData.institution.id,
        name: formValues?.institutionName || institution?.name || defaultData.institution.name,
        campus: formValues?.campusName || campus?.name || defaultData.institution.campus,
        address: formValues?.campusAddress || campus?.address?.toString() || defaultData.institution.address,
        phone: formValues?.campusPhone || campus?.contact?.phone || defaultData.institution.phone,
        whatsapp: formValues?.whatsappNumber || campus?.contact?.whatsapp || defaultData.institution.whatsapp,
        logo: institution?.logo || defaultData.institution.logo,
      },
      fee: {
        components: mappedComponents.length > 0 ? mappedComponents : defaultData.fee.components,
        total: baseAmount || defaultData.fee.total,
        arrears: totalArrears || defaultData.fee.arrears,
        grossTotal: baseAmount + totalArrears || defaultData.fee.grossTotal,
        siblingDiscount: totalDiscount || defaultData.fee.siblingDiscount,
        netPayable: finalAmount || defaultData.fee.netPayable,
        amountInWords: amountInWords || defaultData.fee.amountInWords,
      },
      bank: {
        name: formValues?.bankName || defaultData.bank.name,
        creditAccount: formValues?.bankAccountNumber || defaultData.bank.creditAccount,
        collectionAccount: formValues?.bankCollectionAccount || defaultData.bank.collectionAccount,
        branch: defaultData.bank.branch,
        processingInstructions: defaultData.bank.processingInstructions,
      },
    };
  } catch (error) {
    console.error("Error generating challan data:", error);
    return defaultData;
  }
};

// Component for a sortable element in the designer
interface ComponentItemProps {
  id: string;
  component: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ComponentItem({ id, component, onEdit, onDelete, onMoveUp, onMoveDown }: ComponentItemProps) {
  // Make the component item draggable
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('component-id', id);
    e.dataTransfer.effectAllowed = 'move';

    // Create a ghost image
    const ghostElement = document.createElement('div');
    ghostElement.classList.add('bg-primary', 'text-white', 'p-2', 'rounded', 'text-sm');
    ghostElement.textContent = component.label || component.type;
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 0, 0);

    // Remove the ghost element after drag starts
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };

  return (
    <div
      className="flex items-center justify-between p-3 mb-2 bg-white border rounded-md shadow-sm cursor-move"
      draggable={true}
      onDragStart={handleDragStart}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <Button variant="ghost" size="icon" className="h-4 w-4" onClick={onMoveUp}>
            <ChevronLeft className="h-3 w-3 rotate-90" />
          </Button>
          <Button variant="ghost" size="icon" className="h-4 w-4" onClick={onMoveDown}>
            <ChevronLeft className="h-3 w-3 -rotate-90" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Menu className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">{component.label || component.type}</span>
            {component.field && <span className="text-xs text-muted-foreground ml-2">({component.field})</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(id)}>
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(id)}>
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Draggable component for the challan designer
interface DraggableComponentProps {
  component: any;
  index: number;
  onDragEnd: (id: string, x: number, y: number) => void;
  isSelected: boolean;
  onSelect: () => void;
  isPreview?: boolean;
  copyIndex?: number;
  formValues?: any;
}

function DraggableComponent({
  component,
  index,
  onDragEnd,
  isSelected,
  onSelect,
  isPreview = false,
  copyIndex = 0,
  formValues
}: DraggableComponentProps) {
  // Calculate position based on the component's x and y values
  const style = {
    position: 'absolute' as const,
    left: `${component.x}px`,
    top: `${component.y}px`,
    width: `${component.width}px`,
    height: `${component.height}px`,
    fontSize: `${component.fontSize}px`,
    fontWeight: component.fontWeight,
    textAlign: component.alignment as any,
    cursor: isPreview ? 'default' : 'move',
    border: isSelected ? '2px solid #0ea5e9' : isPreview ? 'none' : '1px dashed #e2e8f0',
    padding: '4px',
    backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
    zIndex: isSelected ? 10 : 1,
    overflow: 'hidden',
    userSelect: 'none' as const,
    touchAction: 'none' as const,
  };

  // Render different component types
  const renderComponentContent = () => {
    switch (component.type) {
      case 'text':
        return <div>{component.value}</div>;
      case 'field':
        // Get the challan data from the form values
        const challanData = getChallanData(null, formValues);

        if (component.field === 'copyLabels[0]' && copyIndex > 0) {
          return <div>{challanData.copyLabels[copyIndex]}</div>;
        }

        // Handle array fields like paymentInstructions
        if (component.field === 'paymentInstructions') {
          return (
            <div className="text-xs">
              {challanData.paymentInstructions.map((instruction, i) => (
                <div key={i} className="mb-1">{`${i + 1}. ${instruction}`}</div>
              ))}
            </div>
          );
        }

        // Handle nested fields with dot notation
        const getNestedValue = (obj: any, path: string) => {
          return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : null;
          }, obj);
        };

        return <div>{getNestedValue(challanData, component.field) || component.value || `[${component.field}]`}</div>;
      case 'table':
        if (component.field === 'fee.components') {
          // Get the challan data from the form values
          const challanData = getChallanData(null, formValues);
          return (
            <table className="w-full text-xs">
              <tbody>
                {challanData.fee.components.map((item, i) => (
                  <tr key={i}>
                    <td className="py-1">{item.name}</td>
                    <td className="py-1 text-right">{item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        return <div>[Table: {component.field}]</div>;
      case 'image':
        return <div className="flex items-center justify-center h-full">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">Logo</div>
        </div>;
      case 'line':
        return <hr className="border-t border-gray-300" />;
      case 'box':
        return <div className="w-full h-full border border-gray-300 rounded"></div>;
      default:
        return <div>{component.label}</div>;
    }
  };

  if (isPreview) {
    return (
      <div style={style}>
        {renderComponentContent()}
      </div>
    );
  }

  return (
    <div
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      id={`component-${component.id}`}
      data-component-id={component.id}
    >
      {renderComponentContent()}
    </div>
  );
}

export default function ChallanDesignerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("design");
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDropZoneId, setActiveDropZoneId] = useState<string | null>(null);

  // Refs for the challan canvas
  const challanCanvasRef = useRef<HTMLDivElement>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px of movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms delay for touch
        tolerance: 5, // 5px of movement during delay
      },
    })
  );

  // Initialize form
  const form = useForm<ChallanTemplateFormValues>({
    resolver: zodResolver(challanTemplateSchema),
    defaultValues: {
      name: "Standard Fee Challan",
      description: "Default fee challan template with 3 copies",
      copies: 3,
      institutionName: "Allied School Ferozpur Road",
      campusName: "Campus (Girls Branch)",
      campusAddress: "19 km Ferozpur Road Lahore",
      whatsappNumber: "03364015028",
      kuickpayPrefix: "13330",
      bankName: "Bank AL Habib Limited",
      bankAccountNumber: "0099-0981-0074-4601-6",
      bankCollectionAccount: "0099-0980-0047-4601-5",
      bankDetails: true,
      showStudentPhoto: false,
      showBarcode: true,
      showQRCode: true,
      showDueDate: true,
      showPaymentInstructions: true,
      paymentInstructions: [
        "How to Pay (Use Numeric of undermentioned)",
        "Kuickpay Prefix+Challan No= Kuickpay ID",
        "Additional Fee of Rs500/- will be charged after Due Date",
        "RS.100/WILL BE CHARGED FOR DUPLICATE FEE CHALLAN",
        "Rs.30 will be charged for Online Payment via Kuickpay"
      ],
      components: [
        {
          id: "institution-logo",
          type: "image",
          label: "Institution Logo",
          field: "institution.logo",
          x: 10,
          y: 10,
          width: 60,
          height: 60,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "center",
          isDraggable: true,
        },
        {
          id: "institution-name",
          type: "text",
          label: "Institution Name",
          value: "Allied School Ferozpur Road",
          x: 80,
          y: 10,
          width: 300,
          height: 30,
          fontSize: 16,
          fontWeight: "bold",
          alignment: "center",
          isDraggable: true,
        },
        {
          id: "campus-name",
          type: "text",
          label: "Campus Name",
          value: "Campus (Girls Branch)",
          x: 80,
          y: 40,
          width: 300,
          height: 20,
          fontSize: 14,
          fontWeight: "normal",
          alignment: "center",
          isDraggable: true,
        },
        {
          id: "campus-address",
          type: "text",
          label: "Campus Address",
          value: "19 km Ferozpur Road Lahore",
          x: 80,
          y: 60,
          width: 300,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "center",
          isDraggable: true,
        },
        {
          id: "whatsapp",
          type: "text",
          label: "WhatsApp",
          value: "WhatsApp Only: 03364015028",
          x: 80,
          y: 80,
          width: 300,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "center",
          isDraggable: true,
        },
        {
          id: "copy-label",
          type: "field",
          label: "Copy Label",
          field: "copyLabels[0]",
          x: 400,
          y: 10,
          width: 100,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "right",
          isDraggable: true,
        },
        {
          id: "kuickpay-prefix",
          type: "text",
          label: "Kuickpay Prefix",
          value: "Kuickpay Prefix: 13330",
          x: 10,
          y: 110,
          width: 200,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "challan-number",
          type: "field",
          label: "Challan Number",
          field: "challanNo",
          value: "Challan #: R-006466",
          x: 220,
          y: 110,
          width: 200,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "bank-name",
          type: "text",
          label: "Bank Name",
          value: "BankIslami Pakistan Limited (All Branches)",
          x: 10,
          y: 140,
          width: 490,
          height: 20,
          fontSize: 12,
          fontWeight: "bold",
          alignment: "center",
          isDraggable: true,
        },
        {
          id: "bank-instructions",
          type: "text",
          label: "Bank Instructions",
          value: "Transaction to be Processed via LinkIslami Only",
          x: 10,
          y: 160,
          width: 490,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "center",
          isDraggable: true,
        },
        {
          id: "bank-details-header",
          type: "text",
          label: "Bank Details Header",
          value: "Bank AL Habib Limited",
          x: 10,
          y: 190,
          width: 490,
          height: 20,
          fontSize: 12,
          fontWeight: "bold",
          alignment: "center",
          isDraggable: true,
        },
        {
          id: "bank-account",
          type: "text",
          label: "Bank Account",
          value: "Credit A/C # 0099-0981-0074-4601-6",
          x: 10,
          y: 210,
          width: 490,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "center",
          isDraggable: true,
        },
        {
          id: "bank-collection",
          type: "text",
          label: "Bank Collection",
          value: "Collection A/C # 0099-0980-0047-4601-5",
          x: 10,
          y: 230,
          width: 490,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "center",
          isDraggable: true,
        },
        {
          id: "month-period",
          type: "text",
          label: "Month Period",
          value: "Month From: May To: May Year: 2025",
          x: 10,
          y: 260,
          width: 490,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "center",
          isDraggable: true,
        },
        {
          id: "due-date",
          type: "text",
          label: "Due Date",
          value: "DUE DATE: 10th OF MAY, 2025",
          x: 10,
          y: 280,
          width: 490,
          height: 20,
          fontSize: 12,
          fontWeight: "bold",
          alignment: "center",
          isDraggable: true,
        },
        {
          id: "ref-no-label",
          type: "text",
          label: "Ref No Label",
          value: "Ref No:",
          x: 10,
          y: 310,
          width: 100,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "ref-no-value",
          type: "field",
          label: "Ref No Value",
          field: "refNo",
          x: 120,
          y: 310,
          width: 200,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "student-name-label",
          type: "text",
          label: "Student Name Label",
          value: "Student Name:",
          x: 10,
          y: 330,
          width: 100,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "student-name-value",
          type: "field",
          label: "Student Name Value",
          field: "student.name",
          x: 120,
          y: 330,
          width: 200,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "father-name-label",
          type: "text",
          label: "Father Name Label",
          value: "Father Name:",
          x: 10,
          y: 350,
          width: 100,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "father-name-value",
          type: "field",
          label: "Father Name Value",
          field: "student.fatherName",
          x: 120,
          y: 350,
          width: 200,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "class-label",
          type: "text",
          label: "Class Label",
          value: "Class:",
          x: 10,
          y: 370,
          width: 100,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "class-value",
          type: "field",
          label: "Class Value",
          field: "class.name",
          x: 120,
          y: 370,
          width: 200,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "particulars-header",
          type: "text",
          label: "Particulars Header",
          value: "Particulars",
          x: 10,
          y: 400,
          width: 300,
          height: 20,
          fontSize: 12,
          fontWeight: "bold",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "amount-header",
          type: "text",
          label: "Amount Header",
          value: "Amount",
          x: 320,
          y: 400,
          width: 100,
          height: 20,
          fontSize: 12,
          fontWeight: "bold",
          alignment: "right",
          isDraggable: true,
        },
        {
          id: "fee-table",
          type: "table",
          label: "Fee Details",
          field: "fee.components",
          x: 10,
          y: 420,
          width: 490,
          height: 80,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "total-label",
          type: "text",
          label: "Total Label",
          value: "Total",
          x: 10,
          y: 500,
          width: 300,
          height: 20,
          fontSize: 12,
          fontWeight: "bold",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "total-value",
          type: "field",
          label: "Total Value",
          field: "fee.total",
          x: 320,
          y: 500,
          width: 100,
          height: 20,
          fontSize: 12,
          fontWeight: "bold",
          alignment: "right",
          isDraggable: true,
        },
        {
          id: "arrears-label",
          type: "text",
          label: "Arrear's Label",
          value: "Arrear's",
          x: 10,
          y: 520,
          width: 300,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "arrears-value",
          type: "field",
          label: "Arrear's Value",
          field: "fee.arrears",
          x: 320,
          y: 520,
          width: 100,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "right",
          isDraggable: true,
        },
        {
          id: "gross-total-label",
          type: "text",
          label: "Gross Total Label",
          value: "Gross Total",
          x: 10,
          y: 540,
          width: 300,
          height: 20,
          fontSize: 12,
          fontWeight: "bold",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "gross-total-value",
          type: "field",
          label: "Gross Total Value",
          field: "fee.grossTotal",
          x: 320,
          y: 540,
          width: 100,
          height: 20,
          fontSize: 12,
          fontWeight: "bold",
          alignment: "right",
          isDraggable: true,
        },
        {
          id: "sibling-disc-label",
          type: "text",
          label: "Sibling Discount Label",
          value: "Sibling / Other Disc",
          x: 10,
          y: 560,
          width: 300,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "sibling-disc-value",
          type: "field",
          label: "Sibling Discount Value",
          field: "fee.siblingDiscount",
          x: 320,
          y: 560,
          width: 100,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "right",
          isDraggable: true,
        },
        {
          id: "net-payable-label",
          type: "text",
          label: "Net Payable Label",
          value: "Net Payable",
          x: 10,
          y: 580,
          width: 300,
          height: 20,
          fontSize: 12,
          fontWeight: "bold",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "net-payable-value",
          type: "field",
          label: "Net Payable Value",
          field: "fee.netPayable",
          x: 320,
          y: 580,
          width: 100,
          height: 20,
          fontSize: 12,
          fontWeight: "bold",
          alignment: "right",
          isDraggable: true,
        },
        {
          id: "amount-in-words-label",
          type: "text",
          label: "Amount in Words Label",
          value: "Amount in words",
          x: 10,
          y: 610,
          width: 120,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "amount-in-words-value",
          type: "field",
          label: "Amount in Words Value",
          field: "fee.amountInWords",
          x: 140,
          y: 610,
          width: 360,
          height: 20,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "note-header",
          type: "text",
          label: "Note Header",
          value: "NOTE",
          x: 10,
          y: 640,
          width: 490,
          height: 20,
          fontSize: 12,
          fontWeight: "bold",
          alignment: "left",
          isDraggable: true,
        },
        {
          id: "payment-instructions",
          type: "field",
          label: "Payment Instructions",
          field: "paymentInstructions",
          x: 10,
          y: 660,
          width: 490,
          height: 100,
          fontSize: 12,
          fontWeight: "normal",
          alignment: "left",
          isDraggable: true,
        },
      ],
    },
  });

  // Watch components for the designer
  const components = form.watch("components") || [];

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveDragId(active.id as string);
    setSelectedComponentId(active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    setActiveDragId(null);

    if (!delta.x && !delta.y) return;

    const componentId = active.id as string;
    const componentIndex = components.findIndex(c => c.id === componentId);

    if (componentIndex === -1) return;

    const component = components[componentIndex];
    const newX = Math.max(0, component.x + delta.x);
    const newY = Math.max(0, component.y + delta.y);

    const updatedComponent = {
      ...component,
      x: newX,
      y: newY
    };

    const newComponents = [...components];
    newComponents[componentIndex] = updatedComponent;

    form.setValue("components", newComponents);

    // Update editing component if it's the one being dragged
    if (editingComponent && editingComponent.id === componentId) {
      setEditingComponent(updatedComponent);
    }
  };

  // Handle component selection
  const handleSelectComponent = (id: string) => {
    setSelectedComponentId(id);
    const component = components.find(c => c.id === id);
    if (component) {
      setEditingComponent(component);
      setActiveTab("properties");
    }
  };

  // Handle canvas click (deselect component)
  const handleCanvasClick = () => {
    setSelectedComponentId(null);
    setEditingComponent(null);
  };

  // Handle moving components up and down in the list
  const handleMoveUp = (id: string) => {
    const index = components.findIndex(item => item.id === id);
    if (index > 0) {
      const newComponents = [...components];
      const temp = newComponents[index];
      newComponents[index] = newComponents[index - 1];
      newComponents[index - 1] = temp;
      form.setValue("components", newComponents);
    }
  };

  const handleMoveDown = (id: string) => {
    const index = components.findIndex(item => item.id === id);
    if (index < components.length - 1) {
      const newComponents = [...components];
      const temp = newComponents[index];
      newComponents[index] = newComponents[index + 1];
      newComponents[index + 1] = temp;
      form.setValue("components", newComponents);
    }
  };

  // Add new component
  const handleAddComponent = (type: string) => {
    const newComponent = {
      id: `component-${Date.now()}`,
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      x: 10,
      y: 10,
      width: type === "table" ? 490 : type === "image" ? 60 : 200,
      height: type === "table" ? 150 : type === "image" ? 60 : 30,
      fontSize: 12,
      fontWeight: "normal" as const,
      alignment: "left" as const,
      isDraggable: true,
    };

    form.setValue("components", [...components, newComponent]);
    setSelectedComponentId(newComponent.id);
    setEditingComponent(newComponent);
    setActiveTab("properties");
  };

  // Edit component
  const handleEditComponent = (id: string) => {
    const component = components.find(c => c.id === id);
    if (component) {
      setSelectedComponentId(id);
      setEditingComponent(component);
      setActiveTab("properties");
    }
  };

  // Delete component
  const handleDeleteComponent = (id: string) => {
    const newComponents = components.filter(c => c.id !== id);
    form.setValue("components", newComponents);

    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }

    if (editingComponent && editingComponent.id === id) {
      setEditingComponent(null);
    }
  };

  // Update component properties
  const handleUpdateComponent = (id: string, updates: Partial<any>) => {
    const componentIndex = components.findIndex(c => c.id === id);
    if (componentIndex === -1) return;

    const updatedComponent = {
      ...components[componentIndex],
      ...updates
    };

    const newComponents = [...components];
    newComponents[componentIndex] = updatedComponent;

    form.setValue("components", newComponents);

    if (editingComponent && editingComponent.id === id) {
      setEditingComponent(updatedComponent);
    }
  };

  // Save template
  const handleSave = (values: ChallanTemplateFormValues) => {
    // In a real implementation, this would save to the database
    toast({
      title: "Template saved",
      description: "Your challan template has been saved successfully",
    });
  };

  // Generate preview URL
  const generatePreviewUrl = () => {
    // In a real implementation, this would generate a preview URL
    return `/api/challan/preview?template=${encodeURIComponent(JSON.stringify(form.getValues()))}`;
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Challan Designer"
        description="Create and customize fee challan templates"
        action={
          <Button variant="outline" onClick={() => router.push("/admin/system/fee-management")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Fee Management
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6 mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="mt-6">
              <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
                <ResizablePanel defaultSize={25} minSize={20}>
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-sm font-medium">Components</h3>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleAddComponent("text")}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 overflow-auto flex-1">
                      <div className="space-y-2 mb-4">
                        <h4 className="text-xs font-medium text-muted-foreground">Add Component</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleAddComponent("text")}>Text</Button>
                          <Button variant="outline" size="sm" onClick={() => handleAddComponent("field")}>Field</Button>
                          <Button variant="outline" size="sm" onClick={() => handleAddComponent("table")}>Table</Button>
                          <Button variant="outline" size="sm" onClick={() => handleAddComponent("image")}>Image</Button>
                          <Button variant="outline" size="sm" onClick={() => handleAddComponent("line")}>Line</Button>
                          <Button variant="outline" size="sm" onClick={() => handleAddComponent("box")}>Box</Button>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <h4 className="text-xs font-medium text-muted-foreground">Common Fields</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                            const newId = `component-${Date.now()}`;
                            handleAddComponent("field");
                            setTimeout(() => {
                              handleUpdateComponent(newId, {
                                label: "Student Name",
                                field: "student.name"
                              });
                            }, 100);
                          }}>
                            <span className="mr-2">Student Name</span>
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                            const newId = `component-${Date.now()}`;
                            handleAddComponent("field");
                            setTimeout(() => {
                              handleUpdateComponent(newId, {
                                label: "Father Name",
                                field: "student.fatherName"
                              });
                            }, 100);
                          }}>
                            <span className="mr-2">Father Name</span>
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                            const newId = `component-${Date.now()}`;
                            handleAddComponent("field");
                            setTimeout(() => {
                              handleUpdateComponent(newId, {
                                label: "Class",
                                field: "class.name"
                              });
                            }, 100);
                          }}>
                            <span className="mr-2">Class</span>
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                            const newId = `component-${Date.now()}`;
                            handleAddComponent("field");
                            setTimeout(() => {
                              handleUpdateComponent(newId, {
                                label: "Challan Number",
                                field: "challanNo"
                              });
                            }, 100);
                          }}>
                            <span className="mr-2">Challan Number</span>
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                            const newId = `component-${Date.now()}`;
                            handleAddComponent("field");
                            setTimeout(() => {
                              handleUpdateComponent(newId, {
                                label: "Due Date",
                                field: "dueDate"
                              });
                            }, 100);
                          }}>
                            <span className="mr-2">Due Date</span>
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                            const newId = `component-${Date.now()}`;
                            handleAddComponent("field");
                            setTimeout(() => {
                              handleUpdateComponent(newId, {
                                label: "Reference Number",
                                field: "refNo"
                              });
                            }, 100);
                          }}>
                            <span className="mr-2">Reference Number</span>
                          </Button>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <h4 className="text-xs font-medium text-muted-foreground mb-2">Template Components</h4>
                      <div className="space-y-2">
                        {components.map(component => (
                          <ComponentItem
                            key={component.id}
                            id={component.id}
                            component={component}
                            onEdit={handleEditComponent}
                            onDelete={handleDeleteComponent}
                            onMoveUp={() => handleMoveUp(component.id)}
                            onMoveDown={() => handleMoveDown(component.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={75}>
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-sm font-medium">Challan Layout</h3>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setPreviewMode(!previewMode)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 overflow-auto flex-1 bg-muted/30">
                      <div
                        className="bg-white p-4 shadow-sm rounded-md mx-auto"
                        style={{ width: "210mm", height: "297mm", maxWidth: "100%", transform: "scale(0.8)", transformOrigin: "top center" }}
                      >
                        <div className="grid grid-cols-1 gap-4 h-full">
                          <DndContext
                            sensors={sensors}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToParentElement]}
                          >
                            {/* Copy 1 - Student */}
                            <div
                              className="border border-dashed border-muted-foreground p-4 rounded-md h-1/3 relative"
                              onClick={handleCanvasClick}
                              ref={challanCanvasRef}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const componentId = e.dataTransfer.getData('component-id');
                                if (componentId) {
                                  // Get the component from the list
                                  const component = components.find(c => c.id === componentId);
                                  if (component) {
                                    // Calculate the drop position relative to the canvas
                                    const rect = challanCanvasRef.current?.getBoundingClientRect();
                                    if (rect) {
                                      const x = Math.max(0, e.clientX - rect.left);
                                      const y = Math.max(0, e.clientY - rect.top);

                                      // Update the component position
                                      handleUpdateComponent(componentId, { x, y });

                                      // Select the component
                                      handleSelectComponent(componentId);
                                    }
                                  }
                                }
                              }}
                            >
                              <div className="absolute top-2 right-2 text-xs text-muted-foreground">Copy 1 - Student</div>

                              {/* Render components for Copy 1 */}
                              {components.map((component, index) => (
                                <DraggableComponent
                                  key={component.id}
                                  component={component}
                                  index={index}
                                  onDragEnd={(id, x, y) => {
                                    const componentIndex = components.findIndex(c => c.id === id);
                                    if (componentIndex !== -1) {
                                      const newComponents = [...components];
                                      newComponents[componentIndex] = {
                                        ...newComponents[componentIndex],
                                        x,
                                        y
                                      };
                                      form.setValue("components", newComponents);
                                    }
                                  }}
                                  isSelected={selectedComponentId === component.id}
                                  onSelect={() => handleSelectComponent(component.id)}
                                  copyIndex={0}
                                  formValues={form.getValues()}
                                />
                              ))}

                              {/* Drag overlay */}
                              <DragOverlay>
                                {activeDragId ? (
                                  <div
                                    className="border-2 border-primary bg-primary/10 absolute pointer-events-none"
                                    style={{
                                      width: components.find(c => c.id === activeDragId)?.width || 100,
                                      height: components.find(c => c.id === activeDragId)?.height || 30,
                                    }}
                                  />
                                ) : null}
                              </DragOverlay>
                            </div>
                          </DndContext>

                          {/* Copy 2 - School */}
                          <div className="border border-dashed border-muted-foreground p-4 rounded-md h-1/3 relative">
                            <div className="absolute top-2 right-2 text-xs text-muted-foreground">Copy 2 - School</div>

                            {/* Render components for Copy 2 (non-draggable preview) */}
                            {components.map((component, index) => (
                              <DraggableComponent
                                key={`copy2-${component.id}`}
                                component={component}
                                index={index}
                                onDragEnd={() => {}}
                                isSelected={false}
                                onSelect={() => {}}
                                isPreview={true}
                                copyIndex={1}
                                formValues={form.getValues()}
                              />
                            ))}
                          </div>

                          {/* Copy 3 - Bank */}
                          <div className="border border-dashed border-muted-foreground p-4 rounded-md h-1/3 relative">
                            <div className="absolute top-2 right-2 text-xs text-muted-foreground">Copy 3 - Bank</div>

                            {/* Render components for Copy 3 (non-draggable preview) */}
                            {components.map((component, index) => (
                              <DraggableComponent
                                key={`copy3-${component.id}`}
                                component={component}
                                index={index}
                                onDragEnd={() => {}}
                                isSelected={false}
                                onSelect={() => {}}
                                isPreview={true}
                                copyIndex={2}
                                formValues={form.getValues()}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </TabsContent>

            <TabsContent value="properties" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Properties</CardTitle>
                  <CardDescription>Configure the challan template settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter template name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="copies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Copies</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={3}
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>Maximum 3 copies per A4 page</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter template description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="institutionName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institution Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter institution name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="campusName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campus Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter campus name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="campusAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campus Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter campus address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whatsappNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter WhatsApp number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="kuickpayPrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kuickpay Prefix</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Kuickpay prefix" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium mb-4">Bank Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter bank name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter bank account number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bankCollectionAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Collection Account</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter bank collection account" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium mb-4">Payment Instructions</h3>

                  <FormField
                    control={form.control}
                    name="paymentInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Instructions</FormLabel>
                        <FormDescription>Enter each instruction on a new line</FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Enter payment instructions"
                            value={field.value.join('\n')}
                            onChange={(e) => {
                              const instructions = e.target.value.split('\n').filter(line => line.trim() !== '');
                              field.onChange(instructions);
                            }}
                            className="min-h-[120px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium mb-4">Display Options</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="bankDetails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Show Bank Details</FormLabel>
                            <FormDescription>Display bank account information</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showStudentPhoto"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Student Photo</FormLabel>
                            <FormDescription>Display student photograph</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showDueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Show Due Date</FormLabel>
                            <FormDescription>Display payment due date</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showPaymentInstructions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Payment Instructions</FormLabel>
                            <FormDescription>Display payment instructions</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {editingComponent && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Component Properties</CardTitle>
                    <CardDescription>Edit the selected component</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormItem>
                        <FormLabel>Label</FormLabel>
                        <FormControl>
                          <Input
                            value={editingComponent.label || ''}
                            onChange={(e) => handleUpdateComponent(editingComponent.id, { label: e.target.value })}
                          />
                        </FormControl>
                      </FormItem>

                      {editingComponent.type === 'text' && (
                        <FormItem>
                          <FormLabel>Text Value</FormLabel>
                          <FormControl>
                            <Input
                              value={editingComponent.value || ''}
                              onChange={(e) => handleUpdateComponent(editingComponent.id, { value: e.target.value })}
                            />
                          </FormControl>
                        </FormItem>
                      )}

                      {editingComponent.type === 'field' && (
                        <FormItem>
                          <FormLabel>Field Path</FormLabel>
                          <FormControl>
                            <Input
                              value={editingComponent.field || ''}
                              onChange={(e) => handleUpdateComponent(editingComponent.id, { field: e.target.value })}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormItem>
                        <FormLabel>X Position (px)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={editingComponent.x}
                            onChange={(e) => handleUpdateComponent(editingComponent.id, { x: parseInt(e.target.value) || 0 })}
                          />
                        </FormControl>
                      </FormItem>

                      <FormItem>
                        <FormLabel>Y Position (px)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={editingComponent.y}
                            onChange={(e) => handleUpdateComponent(editingComponent.id, { y: parseInt(e.target.value) || 0 })}
                          />
                        </FormControl>
                      </FormItem>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormItem>
                        <FormLabel>Width (px)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={editingComponent.width}
                            onChange={(e) => handleUpdateComponent(editingComponent.id, { width: parseInt(e.target.value) || 10 })}
                          />
                        </FormControl>
                      </FormItem>

                      <FormItem>
                        <FormLabel>Height (px)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={editingComponent.height}
                            onChange={(e) => handleUpdateComponent(editingComponent.id, { height: parseInt(e.target.value) || 10 })}
                          />
                        </FormControl>
                      </FormItem>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormItem>
                        <FormLabel>Font Size (px)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={editingComponent.fontSize}
                            onChange={(e) => handleUpdateComponent(editingComponent.id, { fontSize: parseInt(e.target.value) || 12 })}
                          />
                        </FormControl>
                      </FormItem>

                      <FormItem>
                        <FormLabel>Font Weight</FormLabel>
                        <Select
                          value={editingComponent.fontWeight}
                          onValueChange={(value) => handleUpdateComponent(editingComponent.id, { fontWeight: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select weight" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    </div>

                    <FormItem>
                      <FormLabel>Text Alignment</FormLabel>
                      <Select
                        value={editingComponent.alignment}
                        onValueChange={(value) => handleUpdateComponent(editingComponent.id, { alignment: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select alignment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>

                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Draggable</FormLabel>
                        <FormDescription>Allow this component to be dragged</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={editingComponent.isDraggable}
                          onCheckedChange={(checked) => handleUpdateComponent(editingComponent.id, { isDraggable: checked })}
                        />
                      </FormControl>
                    </FormItem>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>Preview how the challan will look when printed</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[600px]">
                  <div className="bg-muted/30 p-4 rounded-md">
                    <div className="bg-white p-4 shadow-sm rounded-md mx-auto" style={{ width: "210mm", minHeight: "297mm", maxWidth: "100%", transform: "scale(0.8)", transformOrigin: "top center" }}>
                      <div className="grid grid-cols-1 gap-4">
                        {/* Copy 1 - Student */}
                        <div className="border p-4 rounded-md relative">
                          <div className="absolute top-2 right-2 text-xs text-muted-foreground">{getChallanData(null, form.getValues()).copyLabels[0]}</div>

                          {/* Render components for preview */}
                          {components.map((component, index) => (
                            <DraggableComponent
                              key={`preview-${component.id}`}
                              component={component}
                              index={index}
                              onDragEnd={() => {}}
                              isSelected={false}
                              onSelect={() => {}}
                              isPreview={true}
                              copyIndex={0}
                              formValues={form.getValues()}
                            />
                          ))}
                        </div>

                        {/* Copy 2 - School */}
                        <div className="border p-4 rounded-md relative">
                          <div className="absolute top-2 right-2 text-xs text-muted-foreground">{getChallanData(null, form.getValues()).copyLabels[1]}</div>

                          {/* Render components for preview */}
                          {components.map((component, index) => (
                            <DraggableComponent
                              key={`preview2-${component.id}`}
                              component={component}
                              index={index}
                              onDragEnd={() => {}}
                              isSelected={false}
                              onSelect={() => {}}
                              isPreview={true}
                              copyIndex={1}
                              formValues={form.getValues()}
                            />
                          ))}
                        </div>

                        {/* Copy 3 - Bank */}
                        <div className="border p-4 rounded-md relative">
                          <div className="absolute top-2 right-2 text-xs text-muted-foreground">{getChallanData(null, form.getValues()).copyLabels[2]}</div>

                          {/* Render components for preview */}
                          {components.map((component, index) => (
                            <DraggableComponent
                              key={`preview3-${component.id}`}
                              component={component}
                              index={index}
                              onDragEnd={() => {}}
                              isSelected={false}
                              onSelect={() => {}}
                              isPreview={true}
                              copyIndex={2}
                              formValues={form.getValues()}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => window.open(generatePreviewUrl(), "_blank")}>
                    <Eye className="h-4 w-4 mr-2" />
                    Open Print Preview
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => router.push("/admin/system/fee-management")}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
