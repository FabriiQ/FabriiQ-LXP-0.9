"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/data-display/card";

interface ContentPreviewProps {
  content: any;
  contentType: "activity" | "assessment";
  mode?: string;
}

export function ContentPreview({ content, contentType, mode = "student" }: ContentPreviewProps) {
  // Simple content renderer based on content type
  const renderContent = () => {
    if (!content) return <p>No content available</p>;

    // Activity content
    if (contentType === "activity") {
      // Reading content (Self Study, Lecture, Tutorial)
      if (content.type === "reading" && Array.isArray(content.content)) {
        return (
          <div className="space-y-4">
            {content.content.map((item: any, index: number) => {
              if (item.type === "p") {
                return (
                  <p key={index} className="text-base">
                    {item.children?.map((child: any, childIndex: number) => (
                      <span key={childIndex}>{child.text}</span>
                    ))}
                  </p>
                );
              }
              return null;
            })}

            {content.checkpoints && content.checkpoints.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Checkpoints</h3>
                <div className="space-y-3">
                  {content.checkpoints.map((checkpoint: any, index: number) => (
                    <Card key={index} className="p-3">
                      <CardContent className="p-0">
                        <p className="font-medium">{checkpoint.title || `Checkpoint ${index + 1}`}</p>
                        <p>{checkpoint.question}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      // Video content (Demonstration)
      if (content.type === "video") {
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
              {content.videoUrl ? (
                <div className="w-full">
                  <p className="text-center p-4 bg-muted">Video: {content.videoUrl}</p>
                </div>
              ) : (
                <p>No video URL provided</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p>{content.description}</p>
            </div>

            {content.questions && content.questions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Questions</h3>
                <div className="space-y-3">
                  {content.questions.map((question: any, index: number) => (
                    <Card key={index} className="p-3">
                      <CardContent className="p-0">
                        <p>{question.text || `Question ${index + 1}`}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      // Discussion content
      if (content.type === "discussion") {
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p>{content.description}</p>
            </div>

            {content.discussionPoints && content.discussionPoints.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Discussion Points</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {content.discussionPoints.map((point: string, index: number) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      // Interactive content (Group Work, Workshop, Other)
      if (content.type === "interactive") {
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p>{content.description}</p>
            </div>

            {content.sections && content.sections.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Sections</h3>
                <div className="space-y-3">
                  {content.sections.map((section: any, index: number) => (
                    <Card key={index} className="p-3">
                      <CardContent className="p-0">
                        <h4 className="font-medium">{section.title || `Section ${index + 1}`}</h4>
                        <p>{section.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    // Assessment content
    if (contentType === "assessment") {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Instructions</h3>
            <p>{content.instructions}</p>
          </div>

          {content.questions && content.questions.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Questions</h3>
              <div className="space-y-3">
                {content.questions.map((question: any, index: number) => (
                  <Card key={index} className="p-3">
                    <CardContent className="p-0">
                      <p className="font-medium">{question.question}</p>
                      {question.type === 'MULTIPLE_CHOICE' && question.options && (
                        <ul className="mt-2 space-y-1">
                          {question.options.map((option: any, optIndex: number) => (
                            <li key={optIndex} className="flex items-center">
                              <span className="w-6 h-6 rounded-full border flex items-center justify-center mr-2">
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span>{option.text}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {question.type === 'TRUE_FALSE' && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full border flex items-center justify-center mr-2">T</span>
                            <span>True</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full border flex items-center justify-center mr-2">F</span>
                            <span>False</span>
                          </div>
                        </div>
                      )}
                      {question.type === 'SHORT_ANSWER' && (
                        <div className="mt-2 p-2 border rounded-md bg-muted/30">
                          <p className="text-sm text-muted-foreground">Short answer response area</p>
                        </div>
                      )}
                      {question.type === 'ESSAY' && (
                        <div className="mt-2 p-2 border rounded-md bg-muted/30 min-h-[100px]">
                          <p className="text-sm text-muted-foreground">Essay response area</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {content.rubric && content.rubric.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Rubric</h3>
              <div className="space-y-3">
                {content.rubric.map((criterion: any, index: number) => (
                  <Card key={index} className="p-3">
                    <CardContent className="p-0">
                      <p className="font-medium">{criterion.criterion} ({criterion.weight}%)</p>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {criterion.levels.map((level: any, levelIndex: number) => (
                          <div key={levelIndex} className="text-center p-1 border rounded">
                            <p className="font-medium">{level.score}</p>
                            <p className="text-xs">{level.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Fallback for unknown content types
    return (
      <div className="p-4 border rounded-md">
        <p className="text-muted-foreground">Preview not available for this content type.</p>
        {mode === "teacher" && (
          <pre className="mt-4 p-2 bg-muted rounded text-xs overflow-auto max-h-[300px]">
            {JSON.stringify(content, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="content-preview">
      {mode === "teacher" && (
        <div className="mb-4 p-3 bg-muted/30 rounded-md">
          <h3 className="text-sm font-medium mb-1">Teacher View</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p><strong>Title:</strong> {content.title}</p>
              <p><strong>Type:</strong> {contentType}</p>
              {content.purpose && <p><strong>Purpose:</strong> {content.purpose}</p>}
              {content.learningType && <p><strong>Learning Type:</strong> {content.learningType}</p>}
              {content.assessmentType && <p><strong>Assessment Type:</strong> {content.assessmentType}</p>}
            </div>
            <div>
              {content.isGradable !== undefined && <p><strong>Gradable:</strong> {content.isGradable ? 'Yes' : 'No'}</p>}
              {content.maxScore && <p><strong>Max Score:</strong> {content.maxScore}</p>}
              {content.passingScore && <p><strong>Passing Score:</strong> {content.passingScore}%</p>}
              {content.timeLimit && <p><strong>Time Limit:</strong> {content.timeLimit} minutes</p>}
            </div>
          </div>
        </div>
      )}
      {renderContent()}
    </div>
  );
}
