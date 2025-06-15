/**
 * Voice service for the Teacher Assistant
 * 
 * Provides speech-to-text and text-to-speech capabilities
 */

import { TeacherAssistantAnalytics, TeacherAssistantEventType } from './analytics';

// Speech recognition options
export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

// Speech synthesis options
export interface SpeechSynthesisOptions {
  voice?: SpeechSynthesisVoice;
  pitch?: number;
  rate?: number;
  volume?: number;
}

/**
 * Voice service for the Teacher Assistant
 */
export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private analytics: TeacherAssistantAnalytics | null = null;
  
  constructor(analytics?: TeacherAssistantAnalytics) {
    this.analytics = analytics || null;
    this.initSpeechRecognition();
    this.initSpeechSynthesis();
  }
  
  /**
   * Initialize speech recognition
   */
  private initSpeechRecognition(): void {
    if (typeof window === 'undefined') return;
    
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }
    
    this.recognition = new SpeechRecognition();
    
    // Set default options
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
  }
  
  /**
   * Initialize speech synthesis
   */
  private initSpeechSynthesis(): void {
    if (typeof window === 'undefined') return;
    
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }
    
    this.synthesis = window.speechSynthesis;
    
    // Load available voices
    this.loadVoices();
    
    // Some browsers load voices asynchronously
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = this.loadVoices.bind(this);
    }
  }
  
  /**
   * Load available voices
   */
  private loadVoices(): void {
    if (!this.synthesis) return;
    
    this.voices = this.synthesis.getVoices();
  }
  
  /**
   * Start speech recognition
   * 
   * @param options Speech recognition options
   * @param onResult Callback for interim results
   * @returns Promise that resolves with the final transcript
   */
  startListening(
    options: SpeechRecognitionOptions = {},
    onResult?: (transcript: string, isFinal: boolean) => void
  ): Promise<string> {
    if (!this.recognition) {
      return Promise.reject(new Error('Speech recognition not supported'));
    }
    
    if (this.isListening) {
      this.stopListening();
    }
    
    // Apply options
    if (options.language) this.recognition.lang = options.language;
    if (options.continuous !== undefined) this.recognition.continuous = options.continuous;
    if (options.interimResults !== undefined) this.recognition.interimResults = options.interimResults;
    if (options.maxAlternatives) this.recognition.maxAlternatives = options.maxAlternatives;
    
    // Track start time for analytics
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }
      
      let finalTranscript = '';
      
      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Call the result callback if provided
        if (onResult) {
          if (event.results[event.resultIndex].isFinal) {
            onResult(finalTranscript, true);
          } else {
            onResult(interimTranscript, false);
          }
        }
      };
      
      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Track error in analytics
        if (this.analytics) {
          this.analytics.trackEvent(TeacherAssistantEventType.ERROR_OCCURRED, {
            error: `Speech recognition error: ${event.error}`,
            duration: Date.now() - startTime
          }).catch(console.error);
        }
        
        reject(new Error(`Speech recognition error: ${event.error}`));
      };
      
      this.recognition.onend = () => {
        this.isListening = false;
        
        // Track voice input in analytics
        if (this.analytics) {
          this.analytics.trackVoiceInput(
            Date.now() - startTime,
            finalTranscript.length > 0
          ).catch(console.error);
        }
        
        resolve(finalTranscript);
      };
      
      // Start recognition
      this.recognition.start();
      this.isListening = true;
    });
  }
  
  /**
   * Stop speech recognition
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
  
  /**
   * Check if speech recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    return !!this.recognition;
  }
  
  /**
   * Check if currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }
  
  /**
   * Speak text using speech synthesis
   * 
   * @param text Text to speak
   * @param options Speech synthesis options
   * @returns Promise that resolves when speech is complete
   */
  speak(text: string, options: SpeechSynthesisOptions = {}): Promise<void> {
    if (!this.synthesis) {
      return Promise.reject(new Error('Speech synthesis not supported'));
    }
    
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply options
    if (options.voice) utterance.voice = options.voice;
    if (options.pitch) utterance.pitch = options.pitch;
    if (options.rate) utterance.rate = options.rate;
    if (options.volume) utterance.volume = options.volume;
    
    // If no voice specified, try to use a female voice
    if (!options.voice && this.voices.length > 0) {
      const femaleVoice = this.voices.find(voice => 
        voice.name.includes('female') || 
        voice.name.includes('Female') || 
        voice.name.includes('Google UK English Female')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
    }
    
    // Track start time for analytics
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      utterance.onend = () => {
        // Track voice output in analytics
        if (this.analytics) {
          this.analytics.trackVoiceOutput(
            text.length,
            Date.now() - startTime
          ).catch(console.error);
        }
        
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        
        // Track error in analytics
        if (this.analytics) {
          this.analytics.trackEvent(TeacherAssistantEventType.ERROR_OCCURRED, {
            error: `Speech synthesis error: ${event.error}`,
            textLength: text.length
          }).catch(console.error);
        }
        
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };
      
      this.synthesis.speak(utterance);
    });
  }
  
  /**
   * Stop speech synthesis
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
  
  /**
   * Check if speech synthesis is supported
   */
  isSpeechSynthesisSupported(): boolean {
    return !!this.synthesis;
  }
  
  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
}
