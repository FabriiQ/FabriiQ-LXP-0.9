'use client';

/**
 * ContentPreview
 * 
 * A reusable component for previewing generated content.
 * Supports different content types and provides print layout options.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, Download, Edit, Save, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ContentPreviewProps {
  title: string;
  content: any;
  contentType: 'activity' | 'assessment' | 'worksheet' | 'lessonPlan';
  onEdit?: () => void;
  onSave?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  className?: string;
  isLoading?: boolean;
  showActions?: boolean;
  showTabs?: boolean;
  renderContent?: (content: any, view: 'preview' | 'print') => React.ReactNode;
}

export function ContentPreview({
  title,
  content,
  contentType,
  onEdit,
  onSave,
  onPrint,
  onDownload,
  className,
  isLoading = false,
  showActions = true,
  showTabs = true,
  renderContent,
}: ContentPreviewProps) {
  const [activeView, setActiveView] = useState<'preview' | 'print'>('preview');
  
  // Get content type specific labels
  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'activity':
        return 'Activity';
      case 'assessment':
        return 'Assessment';
      case 'worksheet':
        return 'Worksheet';
      case 'lessonPlan':
        return 'Lesson Plan';
      default:
        return 'Content';
    }
  };
  
  // Default content renderer if none provided
  const defaultRenderContent = (content: any, view: 'preview' | 'print') => {
    // Handle different content types
    switch (contentType) {
      case 'activity':
        return renderActivityContent(content, view);
      case 'assessment':
        return renderAssessmentContent(content, view);
      case 'worksheet':
        return renderWorksheetContent(content, view);
      case 'lessonPlan':
        return renderLessonPlanContent(content, view);
      default:
        return <div>No preview available</div>;
    }
  };
  
  // Render activity content
  const renderActivityContent = (content: any, view: 'preview' | 'print') => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Instructions</h3>
          <p className="mt-2">{content.instructions || 'No instructions provided.'}</p>
        </div>
        
        {content.questions && content.questions.length > 0 && (
          <div>
            <h3 className="text-lg font-medium">Questions</h3>
            <div className="mt-2 space-y-4">
              {content.questions.map((question: any, index: number) => (
                <div key={index} className="border rounded-md p-4">
                  <p className="font-medium">Question {index + 1}: {question.text}</p>
                  {question.options && question.options.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {question.options.map((option: any, optIndex: number) => (
                        <div key={optIndex} className="flex items-center">
                          <div className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center mr-2",
                            view === 'preview' && option.isCorrect && "bg-green-100 border-green-500"
                          )}>
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <span>{option.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render assessment content
  const renderAssessmentContent = (content: any, view: 'preview' | 'print') => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Instructions</h3>
          <p className="mt-2">{content.instructions || 'No instructions provided.'}</p>
        </div>
        
        {content.sections && content.sections.length > 0 && (
          <div className="space-y-6">
            {content.sections.map((section: any, index: number) => (
              <div key={index}>
                <h3 className="text-lg font-medium">{section.title}</h3>
                <div className="mt-2 space-y-4">
                  {section.questions && section.questions.map((question: any, qIndex: number) => (
                    <div key={qIndex} className="border rounded-md p-4">
                      <p className="font-medium">Question {qIndex + 1}: {question.text}</p>
                      {question.points && (
                        <p className="text-sm text-muted-foreground">Points: {question.points}</p>
                      )}
                      {question.options && question.options.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {question.options.map((option: any, optIndex: number) => (
                            <div key={optIndex} className="flex items-center">
                              <div className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center mr-2",
                                view === 'preview' && option.isCorrect && "bg-green-100 border-green-500"
                              )}>
                                {String.fromCharCode(65 + optIndex)}
                              </div>
                              <span>{option.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Render worksheet content
  const renderWorksheetContent = (content: any, view: 'preview' | 'print') => {
    return (
      <div className={cn(
        "space-y-6",
        view === 'print' && "print:font-serif print:text-black"
      )}>
        <div>
          <h3 className="text-lg font-medium">Instructions</h3>
          <p className="mt-2">{content.instructions || 'No instructions provided.'}</p>
        </div>
        
        {content.sections && content.sections.length > 0 && (
          <div className="space-y-6">
            {content.sections.map((section: any, index: number) => (
              <div key={index}>
                <h3 className="text-lg font-medium">{section.title}</h3>
                <div className="mt-2 space-y-4">
                  {section.content && (
                    <div dangerouslySetInnerHTML={{ __html: section.content }} />
                  )}
                  {section.questions && section.questions.map((question: any, qIndex: number) => (
                    <div key={qIndex} className="border rounded-md p-4">
                      <p className="font-medium">Question {qIndex + 1}: {question.text}</p>
                      {view === 'print' && (
                        <div className="mt-4 border-t pt-4">
                          <div className="h-20 border border-dashed border-gray-300 rounded-md"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Render lesson plan content
  const renderLessonPlanContent = (content: any, view: 'preview' | 'print') => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.startDate && content.endDate && (
            <div>
              <h3 className="text-sm font-medium">Date Range</h3>
              <p className="mt-1">
                {new Date(content.startDate).toLocaleDateString()} - {new Date(content.endDate).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {content.planType && (
            <div>
              <h3 className="text-sm font-medium">Plan Type</h3>
              <p className="mt-1">{content.planType}</p>
            </div>
          )}
        </div>
        
        {content.description && (
          <div>
            <h3 className="text-lg font-medium">Description</h3>
            <p className="mt-2">{content.description}</p>
          </div>
        )}
        
        {content.content && (
          <>
            {content.content.learningObjectives && content.content.learningObjectives.length > 0 && (
              <div>
                <h3 className="text-lg font-medium">Learning Objectives</h3>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {content.content.learningObjectives.map((objective: string, index: number) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {content.content.teachingMethods && content.content.teachingMethods.length > 0 && (
              <div>
                <h3 className="text-lg font-medium">Teaching Methods</h3>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {content.content.teachingMethods.map((method: string, index: number) => (
                    <li key={index}>{method}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {content.content.resources && content.content.resources.length > 0 && (
              <div>
                <h3 className="text-lg font-medium">Resources</h3>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {content.content.resources.map((resource: any, index: number) => (
                    <li key={index}>
                      {resource.name}
                      {resource.description && <span className="text-muted-foreground"> - {resource.description}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {content.content.activities && content.content.activities.length > 0 && (
              <div>
                <h3 className="text-lg font-medium">Activities</h3>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {content.content.activities.map((activity: any, index: number) => (
                    <li key={index}>
                      {activity.name}
                      {activity.description && <span className="text-muted-foreground"> - {activity.description}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {content.content.assessments && content.content.assessments.length > 0 && (
              <div>
                <h3 className="text-lg font-medium">Assessments</h3>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {content.content.assessments.map((assessment: any, index: number) => (
                    <li key={index}>
                      {assessment.name}
                      {assessment.description && <span className="text-muted-foreground"> - {assessment.description}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {content.content.notes && (
              <div>
                <h3 className="text-lg font-medium">Notes</h3>
                <p className="mt-2">{content.content.notes}</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  
  // Handle print button click
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      // Default print behavior
      window.print();
    }
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        
        {showTabs ? (
          <Tabs defaultValue="preview" onValueChange={(value) => setActiveView(value as 'preview' | 'print')}>
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="print">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Layout
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="preview" className="m-0">
              <CardContent className="pt-6">
                {renderContent ? renderContent(content, 'preview') : defaultRenderContent(content, 'preview')}
              </CardContent>
            </TabsContent>
            
            <TabsContent value="print" className="m-0">
              <CardContent className="pt-6">
                <div className="bg-white p-6 border rounded-md shadow-sm">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <p className="text-muted-foreground">
                      {getContentTypeLabel()} | {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  
                  {renderContent ? renderContent(content, 'print') : defaultRenderContent(content, 'print')}
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        ) : (
          <CardContent>
            {renderContent ? renderContent(content, 'preview') : defaultRenderContent(content, 'preview')}
          </CardContent>
        )}
        
        {showActions && (
          <CardFooter className="flex justify-between">
            <div>
              {onEdit && (
                <Button variant="outline" onClick={onEdit} disabled={isLoading}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
            
            <div className="space-x-2">
              {onPrint && (
                <Button variant="outline" onClick={handlePrint} disabled={isLoading}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              )}
              
              {onDownload && (
                <Button variant="outline" onClick={onDownload} disabled={isLoading}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              
              {onSave && (
                <Button onClick={onSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
