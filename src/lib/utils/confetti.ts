'use client';

/**
 * Generate confetti animation within a container element
 * 
 * @param container Container element for confetti
 * @param options Configuration options
 */
export function generateConfetti(
  container: HTMLElement, 
  options: {
    count?: number;
    colors?: string[];
    duration?: number;
    spread?: number;
    gravity?: number;
    reducedMotion?: boolean;
  } = {}
): void {
  // Default options
  const {
    count = 100,
    colors = [
      '#1F504B', // Primary Green
      '#5A8A84', // Medium Teal
      '#D8E3E0', // Light Mint
      '#FFD700', // Gold
      '#FF6B6B', // Coral
      '#4ECDC4', // Turquoise
    ],
    duration = 3,
    spread = 50,
    gravity = 1,
    reducedMotion = false
  } = options;
  
  // Reduce number of confetti pieces for reduced motion
  const actualCount = reducedMotion ? Math.floor(count / 3) : count;
  
  // Clear any existing confetti
  container.innerHTML = '';
  
  for (let i = 0; i < actualCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    
    // Random properties
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 5;
    const left = Math.random() * 100;
    const actualDuration = reducedMotion ? 
      1 + Math.random() : 
      duration + Math.random() * 2;
    const delay = Math.random() * 0.5;
    
    // Apply styles
    confetti.style.backgroundColor = color;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    confetti.style.left = `${left}%`;
    confetti.style.top = '-20px';
    confetti.style.position = 'absolute';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    // Add animation
    confetti.style.animation = `confetti-fall ${actualDuration}s ease-in-out ${delay}s forwards`;
    
    // Add to container
    container.appendChild(confetti);
    
    // Remove after animation
    setTimeout(() => {
      if (container.contains(confetti)) {
        container.removeChild(confetti);
      }
    }, (actualDuration + delay) * 1000);
  }
}

/**
 * Play a sound effect with error handling and user preference respect
 * 
 * @param soundPath Path to the sound file
 * @param volume Volume level (0-1)
 * @returns Promise that resolves when sound is played or rejects on error
 */
export function playSound(soundPath: string, volume: number = 0.5): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Check if user has enabled sounds in preferences
      const soundsEnabled = localStorage.getItem('enableSounds') !== 'false';
      
      if (!soundsEnabled) {
        resolve();
        return;
      }
      
      const audio = new Audio(soundPath);
      audio.volume = volume;
      
      audio.onended = () => {
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error('Error playing sound:', error);
        resolve(); // Resolve anyway to not block UI
      };
      
      audio.play().catch((error) => {
        console.error('Error playing sound:', error);
        resolve(); // Resolve anyway to not block UI
      });
    } catch (error) {
      console.error('Error setting up sound:', error);
      resolve(); // Resolve anyway to not block UI
    }
  });
}

/**
 * Trigger haptic feedback on devices that support it
 * 
 * @param pattern Vibration pattern in milliseconds
 */
export function triggerHapticFeedback(pattern: number | number[] = 10): void {
  try {
    // Check if user has enabled haptic feedback in preferences
    const hapticEnabled = localStorage.getItem('enableHaptic') !== 'false';
    
    if (!hapticEnabled) {
      return;
    }
    
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    console.error('Error triggering haptic feedback:', error);
  }
}

// Add CSS for confetti animation to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes confetti-fall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
