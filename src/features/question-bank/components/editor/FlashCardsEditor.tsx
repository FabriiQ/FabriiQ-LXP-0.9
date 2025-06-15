'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { MediaSelector } from '@/features/activties/components/ui/MediaSelector';
import { FlashCardsContent, FlashCard } from '../../models/types';
import { generateId } from '@/features/activties/models/base';

interface FlashCardsEditorProps {
  content: FlashCardsContent;
  onChange: (content: FlashCardsContent) => void;
}

/**
 * Flash Cards Question Editor for Question Bank
 *
 * This component provides an interface for creating and editing
 * flash cards questions with:
 * - Card management (front and back sides)
 * - Card navigation
 * - Explanation and hint fields
 * - Media attachment
 */
export const FlashCardsEditor: React.FC<FlashCardsEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<FlashCardsContent>(
    content.cards?.length > 0 ? content : {
      cards: [
        { id: generateId(), front: 'What is the capital of France?', back: 'Paris', hint: 'Think of the Eiffel Tower' },
        { id: generateId(), front: 'What is the capital of Japan?', back: 'Tokyo', hint: 'Think of Mount Fuji' },
        { id: generateId(), front: 'What is the capital of Australia?', back: 'Canberra', hint: 'Not Sydney or Melbourne' }
      ]
    }
  );

  // Current card index
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Ref for scrolling to newly added cards
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Get current card
  const currentCard = localContent.cards[currentCardIndex] || localContent.cards[0];

  // Update the local content and call onChange
  const updateContent = (updates: Partial<FlashCardsContent>) => {
    const updatedContent = { ...localContent, ...updates };
    setLocalContent(updatedContent);
    onChange(updatedContent);
  };

  // Handle explanation change
  const handleExplanationChange = (explanation: string) => {
    updateContent({ explanation });
  };

  // Handle hint change
  const handleHintChange = (hint: string) => {
    updateContent({ hint });
  };

  // Update current card
  const updateCard = (updates: Partial<FlashCard>) => {
    const updatedCards = [...localContent.cards];
    updatedCards[currentCardIndex] = {
      ...updatedCards[currentCardIndex],
      ...updates
    };

    updateContent({ cards: updatedCards });
  };

  // Handle card front change
  const handleCardFrontChange = (front: string) => {
    updateCard({ front });
  };

  // Handle card back change
  const handleCardBackChange = (back: string) => {
    updateCard({ back });
  };

  // Handle card hint change
  const handleCardHintChange = (hint: string) => {
    updateCard({ hint });
  };

  // Handle card media change
  const handleCardMediaChange = (media?: any) => {
    // Convert MediaItem to QuestionMedia if needed
    if (media) {
      const questionMedia = {
        type: media.type,
        url: media.url,
        alt: media.alt,
        caption: media.caption
      };
      updateCard({ media: questionMedia });
    } else {
      updateCard({ media: undefined });
    }
  };

  // Add a new card
  const handleAddCard = () => {
    const newCard: FlashCard = {
      id: generateId(),
      front: 'Front of card',
      back: 'Back of card',
      hint: ''
    };

    const updatedCards = [...localContent.cards, newCard];
    updateContent({ cards: updatedCards });

    // Navigate to the new card
    setCurrentCardIndex(updatedCards.length - 1);

    // Scroll to the new card after it's added
    setTimeout(() => {
      if (cardsContainerRef.current) {
        cardsContainerRef.current.scrollTop = cardsContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  // Remove current card
  const handleRemoveCard = () => {
    if (localContent.cards.length <= 1) {
      return; // Don't remove the last card
    }

    const updatedCards = [...localContent.cards];
    updatedCards.splice(currentCardIndex, 1);

    updateContent({ cards: updatedCards });
    setCurrentCardIndex(Math.min(currentCardIndex, updatedCards.length - 1));
  };

  // Navigate to previous card
  const handlePrevCard = () => {
    setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
  };

  // Navigate to next card
  const handleNextCard = () => {
    setCurrentCardIndex(Math.min(localContent.cards.length - 1, currentCardIndex + 1));
  };

  // Flip cards (swap front and back)
  const handleFlipCard = () => {
    const updatedCard = {
      ...currentCard,
      front: currentCard.back,
      back: currentCard.front
    };

    const updatedCards = [...localContent.cards];
    updatedCards[currentCardIndex] = updatedCard;

    updateContent({ cards: updatedCards });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-lg font-medium">Flash Cards</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Card {currentCardIndex + 1} of {localContent.cards.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handlePrevCard}
                  disabled={currentCardIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleNextCard}
                  disabled={currentCardIndex === localContent.cards.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div
            ref={cardsContainerRef}
            className="mb-4 p-4 border rounded-lg bg-white dark:bg-gray-800"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                Card {currentCardIndex + 1}
              </h4>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFlipCard}
                >
                  <RefreshCw className="h-4 w-4 mr-1" /> Flip
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveCard}
                  disabled={localContent.cards.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Front side */}
            <div className="mb-4">
              <Label className="mb-2 block">Front Side</Label>
              <RichTextEditor
                content={currentCard.front}
                onChange={handleCardFrontChange}
                placeholder="Front side text"
                minHeight="100px"
                simple={true}
              />
            </div>

            {/* Back side */}
            <div className="mb-4">
              <Label className="mb-2 block">Back Side</Label>
              <RichTextEditor
                content={currentCard.back}
                onChange={handleCardBackChange}
                placeholder="Back side text"
                minHeight="100px"
                simple={true}
              />
            </div>

            {/* Card hint */}
            <div className="mb-4">
              <Label className="mb-2 block">Card Hint (Optional)</Label>
              <RichTextEditor
                content={currentCard.hint || ''}
                onChange={handleCardHintChange}
                placeholder="Hint for this card"
                minHeight="60px"
                simple={true}
              />
            </div>

            {/* Card media */}
            <div className="mb-4">
              <Label className="mb-2 block">Card Media (Optional)</Label>
              <MediaSelector
                media={currentCard.media ?
                  {
                    type: currentCard.media.type as 'image' | 'video' | 'audio',
                    url: currentCard.media.url || '',
                    alt: currentCard.media.alt,
                    caption: currentCard.media.caption
                  } : undefined
                }
                onChange={handleCardMediaChange}
                allowedTypes={['image', 'video', 'audio']}
                enableJinaAI={true}
              />
            </div>
          </div>

          <div className="mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCard}
              className="mb-4"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Card
            </Button>
          </div>

          <div className="mb-4">
            <Label htmlFor="explanation" className="mb-2 block">Explanation (Optional)</Label>
            <RichTextEditor
              content={localContent.explanation || ''}
              onChange={handleExplanationChange}
              placeholder="Explain the purpose of these flash cards"
              minHeight="100px"
              simple={true}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="hint" className="mb-2 block">General Hint (Optional)</Label>
            <RichTextEditor
              content={localContent.hint || ''}
              onChange={handleHintChange}
              placeholder="Provide a general hint for all cards"
              minHeight="100px"
              simple={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlashCardsEditor;
