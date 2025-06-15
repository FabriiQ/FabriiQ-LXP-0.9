'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FlashCardsActivity, FlashCardDeck, FlashCard } from '../../models/flash-cards';
import { ActivityButton } from '../ui/ActivityButton';
import { AnimatedSubmitButton } from '../ui/AnimatedSubmitButton';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { QuestionHint } from '../ui/QuestionHint';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { useActivityAnalytics } from '../../hooks/useActivityAnalytics';
import { cn } from '@/lib/utils';

// Helper function to shuffle an array (Fisher-Yates algorithm)
const shuffleArray = <T extends unknown>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Animation styles
const flashCardAnimationStyles = `
  /* Card flip animation */
  @keyframes card-flip {
    0% { transform: rotateY(0deg); }
    50% { transform: rotateY(90deg); box-shadow: 0 0 30px rgba(31, 80, 75, 0.2); }
    100% { transform: rotateY(180deg); }
  }

  .card-flip-animation {
    animation: card-flip 0.6s ease-in-out;
  }

  /* Card slide animation */
  @keyframes card-slide {
    0% { transform: translateX(0); opacity: 1; }
    50% { transform: translateX(-50px); opacity: 0; box-shadow: 0 0 30px rgba(31, 80, 75, 0.2); }
    51% { transform: translateX(50px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }

  .card-slide-animation {
    animation: card-slide 0.6s ease-in-out;
  }

  /* Card fade animation */
  @keyframes card-fade {
    0% { opacity: 1; }
    50% { opacity: 0; transform: scale(1.05); }
    100% { opacity: 1; }
  }

  .card-fade-animation {
    animation: card-fade 0.6s ease-in-out;
  }

  /* Card entrance animation */
  @keyframes card-entrance {
    0% { transform: translateY(20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  .card-entrance-animation {
    animation: card-entrance 0.3s ease-out;
  }

  /* Card exit animation */
  @keyframes card-exit {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-20px); opacity: 0; }
  }

  .card-exit-animation {
    animation: card-exit 0.3s ease-in;
  }

  /* Card success animation */
  @keyframes card-success {
    0% { box-shadow: 0 0 0 0 rgba(31, 80, 75, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(31, 80, 75, 0); }
    100% { box-shadow: 0 0 0 0 rgba(31, 80, 75, 0); }
  }

  .card-success-animation {
    animation: card-success 1s ease-in-out;
  }

  /* Card failure animation */
  @keyframes card-failure {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }

  .card-failure-animation {
    animation: card-failure 1s ease-in-out;
  }

  /* Progress indicator animation */
  @keyframes progress-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); background-color: rgba(90, 138, 132, 0.7); }
    100% { transform: scale(1); }
  }

  .progress-active {
    animation: progress-pulse 1.5s infinite;
    background-color: hsl(var(--medium-teal)) !important;
  }

  /* High contrast mode for color blind users */
  @media (prefers-contrast: more) {
    .flash-card {
      border: 2px solid #000 !important;
    }

    .flash-card.flipped .card-front {
      border-style: dashed !important;
    }

    .flash-card.flipped .card-back {
      border-style: solid !important;
    }

    .flash-card-success {
      background-image: linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent) !important;
      background-size: 10px 10px !important;
    }

    .flash-card-failure {
      background-image: linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent) !important;
      background-size: 10px 10px !important;
    }
  }

  /* Touch-friendly improvements */
  @media (pointer: coarse) {
    .flash-card {
      min-height: 250px;
    }

    .card-front, .card-back {
      padding: 16px !important;
    }

    .flash-card-button {
      min-height: 44px;
      min-width: 100px;
      margin: 8px;
    }
  }
`;

export interface FlashCardsViewerProps {
  activity: FlashCardsActivity;
  mode?: 'student' | 'teacher';
  onComplete?: (result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
}

/**
 * Flash Cards Activity Viewer
 *
 * This component displays a flash cards activity with:
 * - Interactive card flipping
 * - Multiple decks
 * - Progress tracking
 * - Self-assessment
 * - Spaced repetition (optional)
 * - Accessibility features for color-blind users
 */
export const FlashCardsViewer: React.FC<FlashCardsViewerProps> = ({
  activity,
  mode = 'student',
  onComplete,
  onProgress,
  className,
  submitButton
}) => {
  // State for tracking current deck and card
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [cardAnimation, setCardAnimation] = useState<string>('');
  const [knownCards, setKnownCards] = useState<Record<string, boolean>>({});
  const [shuffledDecks, setShuffledDecks] = useState<FlashCardDeck[]>([]);
  const [autoFlipTimer, setAutoFlipTimer] = useState<NodeJS.Timeout | null>(null);

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Initialize analytics
  const analytics = useActivityAnalytics(activity.id, activity.activityType);

  // Add animation styles to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = flashCardAnimationStyles;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

  // Initialize shuffled decks
  useEffect(() => {
    // Ensure activity.decks exists with a default if not provided
    const decks = activity.decks || [];

    // Create a copy of the decks array
    let decksCopy = [...decks];

    // Shuffle decks if enabled and there are decks to shuffle
    if (activity.settings?.shuffleQuestions && decksCopy.length > 0) {
      decksCopy = shuffleArray(decksCopy);

      // Also shuffle cards in each deck
      decksCopy = decksCopy.map(deck => ({
        ...deck,
        cards: shuffleArray([...deck.cards])
      }));
    }

    setShuffledDecks(decksCopy);
  }, [activity]);

  // Create a default deck and card if needed
  const defaultDeck = {
    id: 'default-deck',
    title: 'Flash Cards',
    cards: [
      {
        id: 'default-card',
        front: 'Front of card',
        back: 'Back of card'
      }
    ]
  };

  // Handle content from activity if it's passed in a different format
  if ((activity as any).content) {
    const content = (activity as any).content;
    if (content.front && content.back) {
      defaultDeck.cards[0].front = content.front;
      defaultDeck.cards[0].back = content.back;
    }
  }

  // Current deck and card with fallbacks
  const currentDeck = shuffledDecks[currentDeckIndex] || shuffledDecks[0] || defaultDeck;
  const currentCard = currentDeck?.cards?.[currentCardIndex] || currentDeck?.cards?.[0];

  // Auto-flip timer
  useEffect(() => {
    // Clear any existing timer
    if (autoFlipTimer) {
      clearTimeout(autoFlipTimer);
      setAutoFlipTimer(null);
    }

    // Set up auto-flip if enabled
    if (activity.settings?.autoFlip && activity.settings.cardDisplayTime && activity.settings.cardDisplayTime > 0 && !isFlipped) {
      const timer = setTimeout(() => {
        handleFlip();
      }, activity.settings.cardDisplayTime * 1000);

      setAutoFlipTimer(timer);
    }

    return () => {
      if (autoFlipTimer) {
        clearTimeout(autoFlipTimer);
      }
    };
  }, [currentCardIndex, currentDeckIndex, isFlipped, activity.settings?.autoFlip, activity.settings?.cardDisplayTime]);

  // Track progress
  useEffect(() => {
    if (!currentDeck) return;

    // Calculate progress based on cards viewed
    const totalCards = shuffledDecks.reduce((total, deck) => total + deck.cards.length, 0);
    const viewedCards = Object.keys(knownCards).length;
    const progress = totalCards > 0 ? (viewedCards / totalCards) * 100 : 0;

    if (onProgress) {
      onProgress(progress);
    }
  }, [knownCards, shuffledDecks, onProgress]);

  // Handle card flip
  const handleFlip = () => {
    // Determine which animation to use
    let animationName = 'card-flip-animation';
    if (activity.settings?.flipAnimation === 'slide') {
      animationName = 'card-slide-animation';
    } else if (activity.settings?.flipAnimation === 'fade') {
      animationName = 'card-fade-animation';
    }

    setCardAnimation(animationName);

    // Flip the card after a short delay
    setTimeout(() => {
      setIsFlipped(!isFlipped);
      setCardAnimation('');
    }, 300);

    // Track the interaction in analytics
    analytics?.trackInteraction('card_flip', {
      activityId: activity.id,
      deckId: currentDeck.id,
      cardId: currentCard.id,
      toFront: isFlipped
    });
  };

  // Handle next card
  const handleNextCard = () => {
    // If we're at the last card in the deck
    if (currentCardIndex >= currentDeck.cards.length - 1) {
      // If we're at the last deck
      if (currentDeckIndex >= shuffledDecks.length - 1) {
        // Activity is completed
        setIsCompleted(true);

        // Track completion in analytics
        analytics?.trackEvent('activity_complete', {
          activityId: activity.id,
          activityType: activity.activityType,
          cardsViewed: Object.keys(knownCards).length,
          totalCards: shuffledDecks.reduce((total, deck) => total + deck.cards.length, 0)
        });

        // Call onComplete callback if provided
        if (onComplete) {
          onComplete({
            completed: true,
            cardsViewed: Object.keys(knownCards).length,
            totalCards: shuffledDecks.reduce((total, deck) => total + deck.cards.length, 0),
            knownCards
          });
        }
      } else {
        // Move to the next deck
        setCardAnimation('card-exit-animation');

        setTimeout(() => {
          setCurrentDeckIndex(currentDeckIndex + 1);
          setCurrentCardIndex(0);
          setIsFlipped(false);
          setCardAnimation('card-entrance-animation');

          // Clear animation after a short delay
          setTimeout(() => {
            setCardAnimation('');
          }, 300);
        }, 300);
      }
    } else {
      // Move to the next card
      setCardAnimation('card-exit-animation');

      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
        setCardAnimation('card-entrance-animation');

        // Clear animation after a short delay
        setTimeout(() => {
          setCardAnimation('');
        }, 300);
      }, 300);
    }
  };

  // Handle previous card
  const handlePreviousCard = () => {
    // If we're at the first card in the deck
    if (currentCardIndex <= 0) {
      // If we're at the first deck
      if (currentDeckIndex <= 0) {
        // Do nothing
        return;
      } else {
        // Move to the previous deck
        setCardAnimation('card-exit-animation');

        setTimeout(() => {
          setCurrentDeckIndex(currentDeckIndex - 1);
          const prevDeck = shuffledDecks[currentDeckIndex - 1];
          setCurrentCardIndex(prevDeck.cards.length - 1);
          setIsFlipped(false);
          setCardAnimation('card-entrance-animation');

          // Clear animation after a short delay
          setTimeout(() => {
            setCardAnimation('');
          }, 300);
        }, 300);
      }
    } else {
      // Move to the previous card
      setCardAnimation('card-exit-animation');

      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex - 1);
        setIsFlipped(false);
        setCardAnimation('card-entrance-animation');

        // Clear animation after a short delay
        setTimeout(() => {
          setCardAnimation('');
        }, 300);
      }, 300);
    }
  };

  // Handle self-assessment
  const handleSelfAssessment = (known: boolean) => {
    if (!currentCard) return;

    // Update known cards
    setKnownCards(prev => ({
      ...prev,
      [currentCard.id]: known
    }));

    // Apply animation
    setCardAnimation(known ? 'card-success-animation' : 'card-failure-animation');

    // Track the interaction in analytics
    analytics?.trackInteraction('self_assessment', {
      activityId: activity.id,
      deckId: currentDeck.id,
      cardId: currentCard.id,
      known
    });

    // Move to the next card after a short delay
    setTimeout(() => {
      handleNextCard();
    }, 1000);
  };

  // Handle restart
  const handleRestart = () => {
    setCurrentDeckIndex(0);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setKnownCards({});

    // Track restart in analytics
    analytics?.trackEvent('activity_reset', {
      activityId: activity.id,
      activityType: activity.activityType
    });
  };

  // Calculate progress
  const totalCards = shuffledDecks.reduce((total, deck) => total + deck.cards.length, 0);
  const currentCardNumber = shuffledDecks.slice(0, currentDeckIndex).reduce(
    (count, deck) => count + deck.cards.length, 0
  ) + currentCardIndex + 1;
  const progressPercentage = totalCards > 0 ? (currentCardNumber / totalCards) * 100 : 0;

  // Render the flash card
  const renderFlashCard = () => {
    if (!currentCard) return null;

    const isKnown = knownCards[currentCard.id];

    return (
      <div
        ref={cardRef}
        className={cn(
          "relative w-full max-w-2xl mx-auto aspect-[3/2] perspective-1000 cursor-pointer",
          {
            "flash-card-success": isKnown === true,
            "flash-card-failure": isKnown === false
          }
        )}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label={`Flash card: ${isFlipped ? 'Back' : 'Front'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleFlip();
          } else if (e.key === 'ArrowLeft') {
            handlePreviousCard();
          } else if (e.key === 'ArrowRight') {
            handleNextCard();
          }
        }}
        onTouchStart={(e) => {
          touchStartXRef.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartXRef.current !== null) {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartXRef.current - touchEndX;

            // Swipe threshold of 50px
            if (Math.abs(diff) > 50) {
              if (diff > 0) {
                // Swipe left - next card
                handleNextCard();
              } else {
                // Swipe right - previous card
                handlePreviousCard();
              }
              e.preventDefault();
            } else {
              // Small movement - treat as tap/click
              handleFlip();
            }

            touchStartXRef.current = null;
          }
        }}
      >
        <div
          className={cn(
            "flash-card relative w-full h-full transform-style-3d transition-transform duration-500 shadow-lg rounded-xl",
            {
              "flipped transform rotateY-180": isFlipped,
              [cardAnimation]: !!cardAnimation
            }
          )}
        >
          {/* Card Front */}
          <div
            className={cn(
              "card-front absolute inset-0 backface-hidden p-6 flex flex-col justify-center items-center bg-white dark:bg-gray-800 border-2 border-medium-teal/50 dark:border-medium-teal/30 rounded-xl",
              {
                "opacity-0": isFlipped
              }
            )}
          >
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white text-center">
              {currentCard.front}
            </h3>

            {/* Front media */}
            {currentCard.media?.front && (
              <div className="mb-4 max-w-full">
                {currentCard.media.front.type === 'image' && (
                  <img
                    src={currentCard.media.front.url}
                    alt={currentCard.media.front.alt || 'Card image'}
                    className="max-h-48 max-w-full object-contain rounded"
                  />
                )}
                {currentCard.media.front.caption && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
                    {currentCard.media.front.caption}
                  </p>
                )}
              </div>
            )}

            {/* Hint */}
            {currentCard.hint && (
              <div className="mt-4 w-full">
                <QuestionHint hint={currentCard.hint} />
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Click to flip
            </p>
          </div>

          {/* Card Back */}
          <div
            className={cn(
              "card-back absolute inset-0 backface-hidden p-6 flex flex-col justify-center items-center bg-white dark:bg-gray-800 border-2 border-primary-green/50 dark:border-primary-green/30 rounded-xl transform rotateY-180",
              {
                "opacity-0": !isFlipped
              }
            )}
          >
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white text-center">
              {currentCard.back}
            </h3>

            {/* Back media */}
            {currentCard.media?.back && (
              <div className="mb-4 max-w-full">
                {currentCard.media.back.type === 'image' && (
                  <img
                    src={currentCard.media.back.url}
                    alt={currentCard.media.back.alt || 'Card image'}
                    className="max-h-48 max-w-full object-contain rounded"
                  />
                )}
                {currentCard.media.back.caption && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
                    {currentCard.media.back.caption}
                  </p>
                )}
              </div>
            )}

            {/* Self-assessment buttons */}
            {activity.settings?.allowSelfAssessment && (
              <div className="mt-6 flex space-x-4">
                <ActivityButton
                  onClick={() => {
                    handleSelfAssessment(false);
                  }}
                  variant="danger"
                  className="min-h-[44px] min-w-[120px]"
                  aria-label="I didn't know this"
                >
                  <span aria-hidden="true">👎</span> Didn't Know
                </ActivityButton>
                <AnimatedSubmitButton
                  onClick={() => {
                    handleSelfAssessment(true);
                  }}
                  className="min-h-[44px] min-w-[120px]"
                >
                  <span aria-hidden="true">👍</span> Knew It
                </AnimatedSubmitButton>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Click to flip back
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render completion screen
  const renderCompletionScreen = () => {
    const totalCards = shuffledDecks.reduce((total, deck) => total + deck.cards.length, 0);
    const knownCardsCount = Object.values(knownCards).filter(known => known).length;
    const knownPercentage = totalCards > 0 ? (knownCardsCount / totalCards) * 100 : 0;

    return (
      <ThemeWrapper className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">
          Activity Completed!
        </h3>

        <div className="mb-6">
          <p className="text-lg text-gray-700 dark:text-gray-300 text-center">
            You've reviewed all {totalCards} flash cards.
          </p>

          {activity.settings?.allowSelfAssessment && (
            <div className="mt-4">
              <p className="text-md text-gray-700 dark:text-gray-300 text-center">
                You knew {knownCardsCount} out of {totalCards} cards ({Math.round(knownPercentage)}%).
              </p>

              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: `${knownPercentage}%` }}
                  role="progressbar"
                  aria-valuenow={knownPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          {submitButton ? (
            // Use the universal submit button if provided
            React.cloneElement(submitButton as React.ReactElement, {
              onClick: handleRestart,
              disabled: false,
              loading: false,
              submitted: false,
              className: "min-w-[140px]",
              children: 'Start Again'
            })
          ) : (
            // Fallback to AnimatedSubmitButton if no universal button provided
            <AnimatedSubmitButton
              onClick={handleRestart}
              className="min-w-[140px]"
            >
              Start Again
            </AnimatedSubmitButton>
          )}
        </div>
      </ThemeWrapper>
    );
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      {/* Activity header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{activity.title}</h1>
        {activity.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-2">{activity.description}</p>
        )}
        {activity.instructions && (
          <div className="bg-light-mint dark:bg-primary-green/20 p-3 rounded border border-medium-teal/50 dark:border-medium-teal/30">
            <strong className="text-primary-green dark:text-medium-teal">Instructions:</strong>
            <span className="text-gray-700 dark:text-gray-200"> {activity.instructions}</span>
          </div>
        )}
      </div>

      {/* Deck title */}
      {currentDeck && !isCompleted && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Deck: {currentDeck.title}
          </h2>
          {currentDeck.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {currentDeck.description}
            </p>
          )}
        </div>
      )}

      {/* Progress indicator */}
      {activity.settings?.showProgress !== false && !isCompleted && (
        <div className="mb-6">
          <ProgressIndicator
            current={currentCardNumber}
            total={totalCards}
          />
          <div className="flex justify-center mt-3 space-x-1">
            {shuffledDecks.map((deck, deckIndex) => (
              <React.Fragment key={deck.id}>
                {deck.cards.map((card, cardIndex) => {
                  // Calculate the absolute index of this card
                  const absoluteIndex = shuffledDecks.slice(0, deckIndex).reduce(
                    (count, d) => count + d.cards.length, 0
                  ) + cardIndex;

                  // Determine if this is the current card
                  const isCurrent = deckIndex === currentDeckIndex && cardIndex === currentCardIndex;

                  // Determine if this card has been viewed
                  const isViewed = absoluteIndex < currentCardNumber - 1 || knownCards[card.id] !== undefined;

                  return (
                    <div
                      key={card.id}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        {
                          "bg-primary-green": isViewed,
                          "bg-medium-teal/70 progress-active": isCurrent,
                          "bg-gray-300 dark:bg-gray-600": !isViewed && !isCurrent
                        }
                      )}
                      title={`Card ${absoluteIndex + 1} of ${totalCards}`}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
            Card {currentCardNumber} of {totalCards}
          </p>
        </div>
      )}

      {/* Flash card or completion screen */}
      <div className="mb-8">
        {isCompleted ? renderCompletionScreen() : renderFlashCard()}
      </div>

      {/* Navigation buttons */}
      {!isCompleted && (
        <div className="mt-6 flex justify-between">
          <ActivityButton
            onClick={handlePreviousCard}
            disabled={currentDeckIndex === 0 && currentCardIndex === 0}
            variant="secondary"
            icon="arrow-left"
          >
            Previous
          </ActivityButton>

          {submitButton ? (
            // Use the universal submit button if provided
            React.cloneElement(submitButton as React.ReactElement, {
              onClick: handleNextCard,
              disabled: false,
              loading: false,
              submitted: false,
              className: "min-w-[120px]",
              children: currentDeckIndex === shuffledDecks.length - 1 && currentCardIndex === currentDeck?.cards.length - 1
                ? 'Finish'
                : 'Next'
            })
          ) : (
            // Fallback to AnimatedSubmitButton if no universal button provided
            <AnimatedSubmitButton
              onClick={handleNextCard}
              className="min-w-[120px]"
            >
              {currentDeckIndex === shuffledDecks.length - 1 && currentCardIndex === currentDeck?.cards.length - 1
                ? 'Finish'
                : 'Next'
              }
            </AnimatedSubmitButton>
          )}
        </div>
      )}
    </ThemeWrapper>
  );
};

// Note: The shuffleArray function is now defined at the top of the file

export default FlashCardsViewer;
