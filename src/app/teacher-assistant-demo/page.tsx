'use client';

import { Button } from '@/components/ui/core/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/core/card';
import { TeacherAssistantProvider } from '@/features/teacher-assistant';

/**
 * Demo page for the Teacher Assistant feature
 */
export default function TeacherAssistantDemo() {
  return (
    <TeacherAssistantProvider>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Teacher Assistant Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>About Teacher Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The Teacher Assistant is an AI-powered chat interface that provides comprehensive 
                support for teachers across all aspects of their professional responsibilities.
              </p>
              <p className="mb-4">
                It integrates with the platform's existing systems to offer personalized guidance, 
                content creation assistance, classroom management support, and access to external 
                knowledge through Jina Search integration.
              </p>
              <p>
                Click the chat button in the bottom right corner to start using the Teacher Assistant.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Lesson planning and curriculum development assistance</li>
                <li>Assessment creation and grading support</li>
                <li>Student management and intervention recommendations</li>
                <li>Teaching strategy suggestions based on educational psychology</li>
                <li>Administrative task streamlining</li>
                <li>External knowledge search capabilities</li>
                <li>Personalized to teacher preferences and style</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Try These Example Prompts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => {
                    // This would trigger the assistant to open with this prompt
                    console.log('Example prompt clicked');
                  }}
                >
                  "Help me create a lesson plan for teaching fractions to 4th graders"
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => {
                    console.log('Example prompt clicked');
                  }}
                >
                  "I need a formative assessment for my science class on the water cycle"
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => {
                    console.log('Example prompt clicked');
                  }}
                >
                  "What are some strategies for engaging students who are struggling with reading?"
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => {
                    console.log('Example prompt clicked');
                  }}
                >
                  "Find resources about project-based learning in mathematics"
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TeacherAssistantProvider>
  );
}
