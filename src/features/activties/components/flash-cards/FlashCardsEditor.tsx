'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FlashCardsActivity, FlashCardDeck, FlashCard, createDefaultFlashCardsActivity, createDefaultFlashCardDeck, createDefaultFlashCard } from '../../models/flash-cards';
import { ActivityButton } from '../ui/ActivityButton';
import { RichTextEditor } from '../ui/RichTextEditor';
import { MediaUploader } from '../ui/MediaUploader';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface FlashCardsEditorProps {
  activity?: FlashCardsActivity;
  onChange?: (activity: FlashCardsActivity) => void;
  onSave?: (activity: FlashCardsActivity) => void;
  className?: string;
}

/**
 * Flash Cards Activity Editor
 *
 * This component provides an interface for creating and editing flash cards activities.
 * It includes:
 * - Activity metadata editing
 * - Deck management
 * - Card management
 * - Settings configuration
 * - Accessibility features
 */
export const FlashCardsEditor: React.FC<FlashCardsEditorProps> = ({
  activity,
  onChange,
  onSave,
  className
}) => {
  // Initialize with default activity if none provided
  const [localActivity, setLocalActivity] = useState<FlashCardsActivity>(
    activity || createDefaultFlashCardsActivity()
  );

  // Current deck and card being edited
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Preview mode for testing
  const [previewMode, setPreviewMode] = useState(false);

  // Animation and feedback states
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isAddingDeck, setIsAddingDeck] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  // Refs for scrolling to newly added cards
  const cardEditorRef = useRef<HTMLDivElement>(null);

  // Update local activity when prop changes
  useEffect(() => {
    if (activity) {
      setLocalActivity(activity);
    }
  }, [activity]);

  // Get current deck and card
  const currentDeck = localActivity.decks[currentDeckIndex] || localActivity.decks[0];
  const currentCard = currentDeck?.cards[currentCardIndex];

  // Update activity with changes
  const updateActivity = (updates: Partial<FlashCardsActivity>) => {
    const updatedActivity = {
      ...localActivity,
      ...updates,
      updatedAt: new Date()
    };
    setLocalActivity(updatedActivity);

    if (onChange) {
      onChange(updatedActivity);
    }
  };

  // Update current deck
  const updateDeck = (updates: Partial<FlashCardDeck>) => {
    const updatedDecks = [...localActivity.decks];
    updatedDecks[currentDeckIndex] = {
      ...updatedDecks[currentDeckIndex],
      ...updates
    };

    updateActivity({ decks: updatedDecks });
  };

  // Update current card
  const updateCard = (updates: Partial<FlashCard>) => {
    const updatedDecks = [...localActivity.decks];
    const updatedCards = [...updatedDecks[currentDeckIndex].cards];
    updatedCards[currentCardIndex] = {
      ...updatedCards[currentCardIndex],
      ...updates
    };

    updatedDecks[currentDeckIndex] = {
      ...updatedDecks[currentDeckIndex],
      cards: updatedCards
    };

    updateActivity({ decks: updatedDecks });
  };

  // Add a new deck with animation and feedback
  const handleAddDeck = () => {
    setIsAddingDeck(true);

    const newDeck = createDefaultFlashCardDeck();
    updateActivity({
      decks: [...localActivity.decks, newDeck]
    });

    setCurrentDeckIndex(localActivity.decks.length);
    setCurrentCardIndex(0);

    // Show feedback and reset animation state
    setFeedbackMessage({
      type: 'success',
      message: 'New deck added successfully!'
    });

    setTimeout(() => {
      setIsAddingDeck(false);
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedbackMessage(null), 3000);
    }, 500);
  };

  // Remove current deck with feedback
  const handleRemoveDeck = () => {
    if (localActivity.decks.length <= 1) {
      setFeedbackMessage({
        type: 'error',
        message: 'Cannot remove the last deck'
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
      return;
    }

    const updatedDecks = [...localActivity.decks];
    const removedDeckTitle = updatedDecks[currentDeckIndex].title;
    updatedDecks.splice(currentDeckIndex, 1);

    updateActivity({ decks: updatedDecks });
    setCurrentDeckIndex(Math.max(0, currentDeckIndex - 1));
    setCurrentCardIndex(0);

    // Show feedback
    setFeedbackMessage({
      type: 'info',
      message: `Deck "${removedDeckTitle}" removed`
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Add a new card to the current deck with animation and feedback
  const handleAddCard = () => {
    setIsAddingCard(true);

    const newCard = createDefaultFlashCard();
    const updatedDecks = [...localActivity.decks];
    updatedDecks[currentDeckIndex] = {
      ...updatedDecks[currentDeckIndex],
      cards: [...updatedDecks[currentDeckIndex].cards, newCard]
    };

    updateActivity({ decks: updatedDecks });
    setCurrentCardIndex(updatedDecks[currentDeckIndex].cards.length - 1);

    // Show feedback and reset animation state
    setFeedbackMessage({
      type: 'success',
      message: 'New card added successfully!'
    });

    // Scroll to the card editor after a short delay
    setTimeout(() => {
      cardEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsAddingCard(false);
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedbackMessage(null), 3000);
    }, 500);
  };

  // Remove current card with feedback
  const handleRemoveCard = () => {
    if (currentDeck.cards.length <= 1) {
      setFeedbackMessage({
        type: 'error',
        message: 'Cannot remove the last card'
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
      return;
    }

    const updatedDecks = [...localActivity.decks];
    const updatedCards = [...updatedDecks[currentDeckIndex].cards];
    updatedCards.splice(currentCardIndex, 1);

    updatedDecks[currentDeckIndex] = {
      ...updatedDecks[currentDeckIndex],
      cards: updatedCards
    };

    updateActivity({ decks: updatedDecks });
    setCurrentCardIndex(Math.max(0, currentCardIndex - 1));

    // Show feedback
    setFeedbackMessage({
      type: 'info',
      message: 'Card removed'
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Update card media
  const updateCardMedia = (side: 'front' | 'back', updates: Partial<NonNullable<FlashCard['media']>['front']>) => {
    const currentMedia = currentCard.media || {};
    const updatedMedia = {
      ...currentMedia,
      [side]: {
        ...(currentMedia[side] || {}),
        ...updates
      }
    };

    updateCard({ media: updatedMedia });
  };

  // Handle save with feedback
  const handleSave = () => {
    if (onSave) {
      try {
        onSave(localActivity);
        setFeedbackMessage({
          type: 'success',
          message: 'Activity saved successfully!'
        });
      } catch (error) {
        setFeedbackMessage({
          type: 'error',
          message: 'Failed to save activity. Please try again.'
        });
      }
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Feedback message component
  const renderFeedback = () => {
    if (!feedbackMessage) return null;

    const bgColor =
      feedbackMessage.type === 'success' ? 'bg-primary-green' :
      feedbackMessage.type === 'error' ? 'bg-red-600' :
      'bg-medium-teal';

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white ${bgColor} shadow-md`}
      >
        {feedbackMessage.message}
      </motion.div>
    );
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && renderFeedback()}
      </AnimatePresence>

      <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Activity Details</h2>

        {/* Activity title */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            value={localActivity.title}
            onChange={(e) => updateActivity({ title: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Activity description */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={localActivity.description || ''}
            onChange={(e) => updateActivity({ description: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
          />
        </div>

        {/* Activity instructions */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Instructions</label>
          <textarea
            value={localActivity.instructions || ''}
            onChange={(e) => updateActivity({ instructions: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
          />
        </div>

        {/* Activity settings */}
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="shuffleQuestions"
                checked={localActivity.settings?.shuffleQuestions || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    shuffleQuestions: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="shuffleQuestions" className="text-gray-700 dark:text-gray-300">
                Shuffle Cards
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showProgress"
                checked={localActivity.settings?.showProgress !== false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    showProgress: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="showProgress" className="text-gray-700 dark:text-gray-300">
                Show Progress
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowSelfAssessment"
                checked={localActivity.settings?.allowSelfAssessment !== false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    allowSelfAssessment: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="allowSelfAssessment" className="text-gray-700 dark:text-gray-300">
                Allow Self Assessment
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoFlip"
                checked={localActivity.settings?.autoFlip || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    autoFlip: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="autoFlip" className="text-gray-700 dark:text-gray-300">
                Auto Flip Cards
              </label>
            </div>

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Flip Animation
              </label>
              <select
                value={localActivity.settings?.flipAnimation || 'flip'}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    flipAnimation: e.target.value as 'flip' | 'slide' | 'fade'
                  }
                })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="flip">Flip</option>
                <option value="slide">Slide</option>
                <option value="fade">Fade</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Card Display Time (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={localActivity.settings?.cardDisplayTime || 0}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    cardDisplayTime: parseInt(e.target.value)
                  }
                })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                0 means no auto-flip
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deck navigation */}
      <div className="mb-4 p-3 bg-light-mint/30 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select
              value={currentDeckIndex}
              onChange={(e) => {
                setCurrentDeckIndex(parseInt(e.target.value));
                setCurrentCardIndex(0);
              }}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[200px]"
              aria-label="Select deck"
            >
              {localActivity.decks.map((deck, index) => (
                <option key={deck.id} value={index}>
                  Deck {index + 1}: {deck.title}
                </option>
              ))}
            </select>

            <ActivityButton
              onClick={handleRemoveDeck}
              disabled={localActivity.decks.length <= 1}
              variant="danger"
              icon="trash"
              className="min-w-[140px]"
              ariaLabel="Remove current deck"
            >
              Remove Deck
            </ActivityButton>
          </div>

          <div className="flex flex-row items-center gap-2">
            <ActivityButton
              onClick={togglePreview}
              variant="secondary"
              icon={previewMode ? "edit" : "eye"}
              ariaLabel={previewMode ? "Switch to edit mode" : "Switch to preview mode"}
            >
              {previewMode ? "Edit" : "Preview"}
            </ActivityButton>

            <ActivityButton
              onClick={handleAddDeck}
              variant="secondary"
              icon="plus"
              ariaLabel="Add new deck"
            >
              Add Deck
            </ActivityButton>
          </div>
        </div>
      </div>

      {/* Deck editor */}
      <motion.div
        className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
        initial={{ opacity: 0.8 }}
        animate={{
          opacity: 1,
          scale: isAddingDeck ? [1, 1.02, 1] : 1,
          transition: {
            duration: 0.3,
            scale: { duration: 0.5 }
          }
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Deck {currentDeckIndex + 1}
          </h3>
          <span className="text-xs px-2 py-1 bg-light-mint text-primary-green rounded-full">
            {currentDeckIndex + 1} of {localActivity.decks.length}
          </span>
        </div>

        {/* Deck title */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Deck Title</label>
          <input
            type="text"
            value={currentDeck.title}
            onChange={(e) => updateDeck({ title: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Deck description */}
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Deck Description</label>
          <textarea
            value={currentDeck.description || ''}
            onChange={(e) => updateDeck({ description: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
          />
        </div>

        {/* Card navigation */}
        <div className="mb-4 p-3 bg-light-mint/20 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col xs:flex-row xs:items-center gap-2">
              <select
                value={currentCardIndex}
                onChange={(e) => setCurrentCardIndex(parseInt(e.target.value))}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
                aria-label="Select card"
              >
                {currentDeck.cards.map((card, index) => (
                  <option key={card.id} value={index}>
                    Card {index + 1}
                  </option>
                ))}
              </select>

              <ActivityButton
                onClick={handleRemoveCard}
                disabled={currentDeck.cards.length <= 1}
                variant="danger"
                icon="trash"
                ariaLabel="Remove current card"
              >
                Remove Card
              </ActivityButton>
            </div>

            <ActivityButton
              onClick={handleAddCard}
              variant="secondary"
              icon="plus"
              ariaLabel="Add new card"
              className="sm:self-end"
            >
              Add Card
            </ActivityButton>
          </div>
        </div>

        {/* Card editor */}
        <motion.div
          ref={cardEditorRef}
          className="mb-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 shadow-sm"
          initial={{ opacity: 0.8, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: isAddingCard ? [1, 1.02, 1] : 1,
            transition: {
              duration: 0.3,
              scale: { duration: 0.5 }
            }
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
              Card {currentCardIndex + 1}
            </h4>
            <span className="text-xs px-2 py-1 bg-light-mint text-primary-green rounded-full">
              {currentCardIndex + 1} of {currentDeck.cards.length}
            </span>
          </div>

          {/* Front side */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Front Side</h5>

            <div className="mb-3">
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Text</label>
              <textarea
                value={currentCard.front}
                onChange={(e) => updateCard({ front: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
              />
            </div>

            {/* Front media */}
            <div className="mb-3">
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Media Type</label>
              <select
                value={currentCard.media?.front?.type || 'none'}
                onChange={(e) => {
                  const type = e.target.value;
                  if (type === 'none') {
                    // Remove front media
                    const currentMedia = currentCard.media || {};
                    const { front, ...rest } = currentMedia;
                    updateCard({ media: Object.keys(rest).length > 0 ? rest : undefined });
                  } else {
                    // Add or update front media
                    updateCardMedia('front', {
                      type: type as 'image' | 'text',
                      url: type === 'image' ? '' : undefined,
                      content: type === 'text' ? '' : undefined
                    });
                  }
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="none">None</option>
                <option value="image">Image</option>
                <option value="text">Text</option>
              </select>
            </div>

            {currentCard.media?.front?.type === 'image' && (
              <div className="mb-3">
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Image URL</label>
                <input
                  type="text"
                  value={currentCard.media.front.url || ''}
                  onChange={(e) => updateCardMedia('front', { url: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://example.com/image.jpg"
                />

                <label className="block mb-1 mt-2 text-sm text-gray-700 dark:text-gray-300">Alt Text</label>
                <input
                  type="text"
                  value={currentCard.media.front.alt || ''}
                  onChange={(e) => updateCardMedia('front', { alt: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Description of the image"
                />
              </div>
            )}

            {currentCard.media?.front?.type === 'text' && (
              <div className="mb-3">
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Additional Text</label>
                <textarea
                  value={currentCard.media.front.content || ''}
                  onChange={(e) => updateCardMedia('front', { content: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Additional text content"
                />
              </div>
            )}

            {currentCard.media?.front && (
              <div className="mb-3">
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Caption (Optional)</label>
                <input
                  type="text"
                  value={currentCard.media.front.caption || ''}
                  onChange={(e) => updateCardMedia('front', { caption: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Caption for the media"
                />
              </div>
            )}
          </div>

          {/* Back side */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Back Side</h5>

            <div className="mb-3">
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Text</label>
              <textarea
                value={currentCard.back}
                onChange={(e) => updateCard({ back: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
              />
            </div>

            {/* Back media */}
            <div className="mb-3">
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Media Type</label>
              <select
                value={currentCard.media?.back?.type || 'none'}
                onChange={(e) => {
                  const type = e.target.value;
                  if (type === 'none') {
                    // Remove back media
                    const currentMedia = currentCard.media || {};
                    const { back, ...rest } = currentMedia;
                    updateCard({ media: Object.keys(rest).length > 0 ? rest : undefined });
                  } else {
                    // Add or update back media
                    updateCardMedia('back', {
                      type: type as 'image' | 'text',
                      url: type === 'image' ? '' : undefined,
                      content: type === 'text' ? '' : undefined
                    });
                  }
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="none">None</option>
                <option value="image">Image</option>
                <option value="text">Text</option>
              </select>
            </div>

            {currentCard.media?.back?.type === 'image' && (
              <div className="mb-3">
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Image URL</label>
                <input
                  type="text"
                  value={currentCard.media.back.url || ''}
                  onChange={(e) => updateCardMedia('back', { url: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://example.com/image.jpg"
                />

                <label className="block mb-1 mt-2 text-sm text-gray-700 dark:text-gray-300">Alt Text</label>
                <input
                  type="text"
                  value={currentCard.media.back.alt || ''}
                  onChange={(e) => updateCardMedia('back', { alt: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Description of the image"
                />
              </div>
            )}

            {currentCard.media?.back?.type === 'text' && (
              <div className="mb-3">
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Additional Text</label>
                <textarea
                  value={currentCard.media.back.content || ''}
                  onChange={(e) => updateCardMedia('back', { content: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Additional text content"
                />
              </div>
            )}

            {currentCard.media?.back && (
              <div className="mb-3">
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Caption (Optional)</label>
                <input
                  type="text"
                  value={currentCard.media.back.caption || ''}
                  onChange={(e) => updateCardMedia('back', { caption: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Caption for the media"
                />
              </div>
            )}
          </div>

          {/* Hint */}
          <div className="mb-3">
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Hint (Optional)</label>
            <textarea
              value={currentCard.hint || ''}
              onChange={(e) => updateCard({ hint: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Hint for the card"
            />
          </div>

          {/* Tags */}
          <div className="mb-3">
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Tags (Optional, comma-separated)</label>
            <input
              type="text"
              value={(currentCard.tags || []).join(', ')}
              onChange={(e) => {
                const tagsString = e.target.value;
                const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
                updateCard({ tags });
              }}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="tag1, tag2, tag3"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Save button */}
      <motion.div
        className="mt-6 flex justify-end"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ActivityButton
          onClick={handleSave}
          variant="primary"
          icon="save"
          size="lg"
          ariaLabel="Save flash cards activity"
          className="px-6 py-3"
        >
          Save Activity
        </ActivityButton>
      </motion.div>
    </ThemeWrapper>
  );
};

export default FlashCardsEditor;
