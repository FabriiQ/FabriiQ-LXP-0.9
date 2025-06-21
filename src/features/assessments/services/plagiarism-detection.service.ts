import { GoogleGenerativeAI } from '@google/generative-ai';
import { PlagiarismResult } from '../types/essay';

/**
 * Plagiarism Detection Service
 * Detects potential plagiarism in essay submissions using AI and database comparison
 */
export class PlagiarismDetectionService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private prisma: any;

  constructor(prisma: any) {
    this.prisma = prisma;

    // Try to get the API key from environment variables
    let apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey && typeof window === 'undefined') {
      apiKey = process.env.GEMINI_API_KEY;
    }
    
    if (!apiKey) {
      apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
    }

    if (!apiKey) {
      throw new Error('Google Generative AI API key not found for plagiarism detection');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent analysis
        maxOutputTokens: 2000,
      }
    });
  }

  /**
   * Check for plagiarism in an essay submission
   */
  async checkPlagiarism(
    content: string,
    assessmentId: string,
    studentId: string,
    threshold: number = 20,
    options: {
      checkDatabase?: boolean;
      checkSubmissions?: boolean;
      checkInternet?: boolean;
    } = {}
  ): Promise<PlagiarismResult> {
    try {
      const {
        checkDatabase = true,
        checkSubmissions = true,
        checkInternet = false
      } = options;

      const sources: PlagiarismResult['sources'] = [];
      let maxSimilarity = 0;

      // Check against other submissions in the same assessment
      if (checkSubmissions) {
        const submissionSimilarities = await this.checkAgainstSubmissions(
          content,
          assessmentId,
          studentId
        );
        sources.push(...submissionSimilarities);
        maxSimilarity = Math.max(maxSimilarity, ...submissionSimilarities.map(s => s.similarity));
      }

      // Check against database of known content (if implemented)
      if (checkDatabase) {
        const databaseSimilarities = await this.checkAgainstDatabase(content);
        sources.push(...databaseSimilarities);
        maxSimilarity = Math.max(maxSimilarity, ...databaseSimilarities.map(s => s.similarity));
      }

      // Check against internet sources (basic implementation)
      if (checkInternet) {
        const internetSimilarities = await this.checkAgainstInternet(content);
        sources.push(...internetSimilarities);
        maxSimilarity = Math.max(maxSimilarity, ...internetSimilarities.map(s => s.similarity));
      }

      const result: PlagiarismResult = {
        similarityPercentage: maxSimilarity,
        sources: sources.sort((a, b) => b.similarity - a.similarity).slice(0, 10), // Top 10 matches
        flagged: maxSimilarity >= threshold,
        checkedAt: new Date()
      };

      console.log('Plagiarism check completed', {
        assessmentId,
        studentId,
        similarity: maxSimilarity,
        flagged: result.flagged,
        sourcesFound: sources.length
      });

      return result;
    } catch (error) {
      console.error('Error in plagiarism detection:', error);
      throw new Error(`Plagiarism detection failed: ${(error as Error).message}`);
    }
  }

  /**
   * Check against other submissions in the same assessment
   */
  private async checkAgainstSubmissions(
    content: string,
    assessmentId: string,
    excludeStudentId: string
  ): Promise<PlagiarismResult['sources']> {
    try {
      // Get other submissions for the same assessment
      const otherSubmissions = await this.prisma.assessmentSubmission.findMany({
        where: {
          assessmentId,
          studentId: { not: excludeStudentId },
          status: { not: 'DRAFT' }
        },
        select: {
          id: true,
          studentId: true,
          answers: true,
          student: {
            select: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        take: 50 // Limit to recent submissions
      });

      const similarities: PlagiarismResult['sources'] = [];

      for (const submission of otherSubmissions) {
        // Extract essay content from answers
        const essayContent = this.extractEssayContent(submission.answers);
        if (!essayContent || essayContent.length < 100) continue;

        const similarity = await this.calculateTextSimilarity(content, essayContent);
        
        if (similarity > 10) { // Only include significant similarities
          similarities.push({
            text: this.getExcerpt(essayContent, 200),
            similarity,
            source: `Student submission by ${submission.student?.user?.name || 'Unknown'}`,
            studentId: submission.studentId,
            submissionId: submission.id
          });
        }
      }

      return similarities;
    } catch (error) {
      console.error('Error checking against submissions:', error);
      return [];
    }
  }

  /**
   * Check against database of known content
   */
  private async checkAgainstDatabase(content: string): Promise<PlagiarismResult['sources']> {
    try {
      // This would check against a database of known essays, articles, etc.
      // For now, we'll implement a basic check against common phrases
      
      const commonPhrases = [
        "In conclusion, it can be said that",
        "Throughout history, mankind has",
        "In today's society, we can see that",
        "It is widely believed that",
        "From the beginning of time"
      ];

      const similarities: PlagiarismResult['sources'] = [];

      for (const phrase of commonPhrases) {
        if (content.toLowerCase().includes(phrase.toLowerCase())) {
          similarities.push({
            text: phrase,
            similarity: 15, // Low similarity for common phrases
            source: 'Common academic phrases database'
          });
        }
      }

      return similarities;
    } catch (error) {
      console.error('Error checking against database:', error);
      return [];
    }
  }

  /**
   * Check against internet sources (basic implementation)
   */
  private async checkAgainstInternet(content: string): Promise<PlagiarismResult['sources']> {
    try {
      // This is a simplified implementation
      // In a real system, you would use services like Copyscape, Turnitin API, etc.
      
      const prompt = `Analyze this text for potential plagiarism indicators. Look for:
1. Overly formal or inconsistent writing style
2. Sudden changes in vocabulary level
3. Phrases that seem copied from academic sources
4. Unusual formatting or structure

Text: ${content.substring(0, 1000)}...

Return JSON with potential issues:
{
  "suspiciousSegments": [
    {
      "text": "suspicious text segment",
      "reason": "why it's suspicious",
      "similarity": number (0-100)
    }
  ]
}`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.suspiciousSegments?.map((segment: any) => ({
          text: segment.text,
          similarity: segment.similarity || 25,
          source: `Potential internet source: ${segment.reason}`
        })) || [];
      }

      return [];
    } catch (error) {
      console.error('Error checking against internet:', error);
      return [];
    }
  }

  /**
   * Calculate similarity between two texts using AI
   */
  private async calculateTextSimilarity(text1: string, text2: string): Promise<number> {
    try {
      const prompt = `Compare these two texts and rate their similarity from 0-100:

Text 1: ${text1.substring(0, 500)}...

Text 2: ${text2.substring(0, 500)}...

Consider:
- Similar ideas and arguments
- Similar sentence structures
- Similar word choices
- Similar examples or evidence

Return only a number (0-100) representing similarity percentage.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();
      
      const similarity = parseInt(response.match(/\d+/)?.[0] || '0');
      return Math.min(Math.max(similarity, 0), 100);
    } catch (error) {
      console.error('Error calculating text similarity:', error);
      return 0;
    }
  }

  /**
   * Extract essay content from submission answers
   */
  private extractEssayContent(answers: any): string {
    if (!answers || typeof answers !== 'object') return '';
    
    // Look for essay content in various possible formats
    const possibleKeys = ['essay', 'content', 'answer', 'response'];
    
    for (const key of possibleKeys) {
      if (answers[key] && typeof answers[key] === 'string') {
        return answers[key];
      }
    }

    // If answers is an array, look for essay content
    if (Array.isArray(answers)) {
      for (const answer of answers) {
        if (answer && typeof answer === 'object' && answer.content) {
          return answer.content;
        }
      }
    }

    return '';
  }

  /**
   * Get excerpt from text
   */
  private getExcerpt(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Generate plagiarism report
   */
  async generatePlagiarismReport(result: PlagiarismResult): Promise<string> {
    try {
      const prompt = `Generate a plagiarism report based on this analysis:

Similarity: ${result.similarityPercentage}%
Flagged: ${result.flagged}
Sources found: ${result.sources.length}

Sources:
${result.sources.map(source => `- ${source.similarity}% similar to: ${source.source}`).join('\n')}

Create a professional report explaining:
1. Overall assessment
2. Key findings
3. Recommendations for the instructor
4. Next steps if plagiarism is suspected

Keep it concise and professional.`;

      const aiResult = await this.model.generateContent(prompt);
      return aiResult.response.text();
    } catch (error) {
      console.error('Error generating plagiarism report:', error);
      return `Plagiarism Analysis Report

Overall Similarity: ${result.similarityPercentage}%
Status: ${result.flagged ? 'FLAGGED for review' : 'No significant issues detected'}

${result.sources.length > 0 ? 
  `Sources of similarity found:\n${result.sources.map(s => `• ${s.similarity}% - ${s.source}`).join('\n')}` :
  'No significant sources of similarity detected.'
}

${result.flagged ? 
  'Recommendation: Manual review recommended due to high similarity percentage.' :
  'Recommendation: No immediate action required.'
}`;
    }
  }
}
