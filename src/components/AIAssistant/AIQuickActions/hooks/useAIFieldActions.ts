/**
 * useAIFieldActions Hook
 * Universal hook for managing AI quick actions state and logic
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
// @ts-ignore - uuidv4 doesn't have types
import uuidV4 from 'uuidv4';

import aiAssistantService from '../../AIAssistantService';
import { generateText, cancelRequest as cancelTextRequest } from '../../TextAIService';
import { getFieldConfig, getAvailableActions, RESULT_MODES, FieldActionConfig, QuickAction } from '../config/fieldActionConfigs';
import { NotificationManager } from '@/services/notifications';
import { t } from '@/helpers/export/util';

/**
 * Result state
 */
export interface AIResult {
  originalValue: string;
  generatedValue: string;
  explanation: string;
}

/**
 * Generation request parameters
 */
export interface GenerateRequestParams {
  prompt?: string;
  quickActionId?: string;
  currentValue: string;
  fieldType: string;
  contextType: string;
  recordRef: string;
  conversationId: string | null;
  additionalContext: Record<string, unknown>;
  /** Callback to receive requestId immediately for cancellation support */
  onRequestId?: (requestId: string) => void;
}

/**
 * Generation result
 */
export interface GenerateResult {
  generatedValue?: string;
  modifiedScript?: string;
  explanation?: string;
  requestId?: string;
}

/**
 * Hook options
 */
export interface UseAIFieldActionsOptions {
  fieldType: string;
  getValue: () => string;
  setValue: (value: string) => void;
  recordRef?: string;
  contextType?: string;
  additionalContext?: Record<string, unknown>;
  onGenerateRequest?: (params: GenerateRequestParams) => Promise<GenerateResult>;
  selectedText?: string;
  disabled?: boolean;
}

/**
 * Hook return type
 */
export interface UseAIFieldActionsReturn {
  isAvailable: boolean;
  isActionsBarVisible: boolean;
  isResultVisible: boolean;
  isGenerating: boolean;
  isApplying: boolean;
  result: AIResult;
  conversationId: string | null;
  fieldConfig: FieldActionConfig;
  availableActions: QuickAction[];
  openActionsBar: () => void;
  closeActionsBar: () => void;
  closeResult: () => void;
  cancelGeneration: () => void;
  handleQuickAction: (actionId: string) => void;
  handlePromptSubmit: (prompt: string) => void;
  applyResult: () => void;
  retryGeneration: (newPrompt: string) => Promise<void>;
  requestAnotherVariant: () => void;
}

/**
 * AI Field Actions Hook
 */
const useAIFieldActions = ({
  fieldType,
  getValue,
  setValue,
  recordRef = '',
  contextType = '',
  additionalContext = {},
  onGenerateRequest,
  selectedText = '',
  disabled = false
}: UseAIFieldActionsOptions): UseAIFieldActionsReturn => {
  // AI availability state
  const [isAvailable, setIsAvailable] = useState(false);

  // UI state
  const [isActionsBarVisible, setIsActionsBarVisible] = useState(false);
  const [isResultVisible, setIsResultVisible] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Conversation tracking for multi-turn interactions
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<AIResult>({
    originalValue: '',
    generatedValue: '',
    explanation: ''
  });

  // Ref for tracking mounted state
  const isMountedRef = useRef(true);

  // Ref for tracking active request (for cancellation on unmount)
  const activeRequestIdRef = useRef<string | null>(null);

  // Ref for storing initial generation parameters (for "Another variant")
  const initialGenerationRef = useRef<{
    originalValue: string;
    quickActionId?: string;
  } | null>(null);

  // Ref for tracking if generation was cancelled
  const isCancelledRef = useRef(false);

  // Get field configuration
  const fieldConfig = useMemo(() => getFieldConfig(fieldType), [fieldType]);

  // Get current value - use callback to avoid stale closure issues
  const getCurrentValue = useCallback(() => {
    return typeof getValue === 'function' ? getValue() : '';
  }, [getValue]);

  // Available quick actions - computed when actions bar opens
  const [availableActions, setAvailableActions] = useState<QuickAction[]>(() => {
    // Initial value based on current content
    const currentValue = typeof getValue === 'function' ? getValue() : '';
    return getAvailableActions(fieldType, currentValue, contextType);
  });

  // Check AI availability on mount
  useEffect(() => {
    isMountedRef.current = true;

    const checkAvailability = async () => {
      const available = await aiAssistantService.isAvailable();
      if (isMountedRef.current) {
        setIsAvailable(available);
      }
    };

    const handleAvailabilityChange = async () => {
      await checkAvailability();
    };

    checkAvailability();
    aiAssistantService.addAvailabilityListener(handleAvailabilityChange);

    return () => {
      isMountedRef.current = false;
      aiAssistantService.removeAvailabilityListener(handleAvailabilityChange);

      // Cancel any active request on unmount
      if (activeRequestIdRef.current) {
        cancelTextRequest(activeRequestIdRef.current);
        activeRequestIdRef.current = null;
      }
    };
  }, []);

  /**
   * Open the actions bar
   */
  const openActionsBar = useCallback(() => {
    if (disabled || !isAvailable) {
      if (!isAvailable) {
        NotificationManager.error(
          t('ai-actions.error.unavailable', 'AI Assistant is unavailable'),
          t('ai-actions.error.title', 'Error')
        );
      }
      return;
    }

    // Recompute available actions based on current content and context type
    const currentValue = getCurrentValue();
    setAvailableActions(getAvailableActions(fieldType, currentValue, contextType));

    // Start new conversation
    setConversationId(uuidV4());
    setIsActionsBarVisible(true);
    setIsResultVisible(false);
  }, [disabled, isAvailable, getCurrentValue, fieldType, contextType]);

  /**
   * Close the actions bar
   */
  const closeActionsBar = useCallback(() => {
    if (!isGenerating) {
      setIsActionsBarVisible(false);
      setConversationId(null);
    }
  }, [isGenerating]);

  /**
   * Close the result preview
   */
  const closeResult = useCallback(() => {
    if (!isApplying) {
      setIsResultVisible(false);
      setResult({
        originalValue: '',
        generatedValue: '',
        explanation: ''
      });
      initialGenerationRef.current = null;
    }
  }, [isApplying]);

  /**
   * Cancel ongoing generation
   */
  const cancelGeneration = useCallback(() => {
    // Set cancelled flag to ignore incoming results
    isCancelledRef.current = true;

    // Cancel active request if we have a requestId
    if (activeRequestIdRef.current) {
      cancelTextRequest(activeRequestIdRef.current);
      activeRequestIdRef.current = null;
    }

    // Reset UI state
    setIsGenerating(false);
    setIsResultVisible(false);
    setIsActionsBarVisible(false);
    setResult({
      originalValue: '',
      generatedValue: '',
      explanation: ''
    });
    initialGenerationRef.current = null;
    setConversationId(null);

    // Reset cancelled flag after cleanup completes to allow future generations
    // Use setTimeout to ensure all pending callbacks see the cancelled state first
    setTimeout(() => {
      isCancelledRef.current = false;
    }, 0);
  }, []);

  /**
   * Generate content using AI
   */
  const generate = useCallback(async ({ prompt, quickActionId }: { prompt?: string; quickActionId?: string } = {}) => {
    if (isGenerating || (!prompt?.trim() && !quickActionId)) return;

    // Reset cancelled flag at start of new generation
    isCancelledRef.current = false;
    setIsGenerating(true);
    activeRequestIdRef.current = null;

    // Show result popup immediately with loading state (hide actions bar)
    setIsActionsBarVisible(false);
    setIsResultVisible(true);

    try {
      const currentVal = typeof getValue === 'function' ? getValue() : '';

      // If custom handler provided, use it
      if (typeof onGenerateRequest === 'function') {
        const generatedResult = await onGenerateRequest({
          prompt,
          quickActionId,
          currentValue: currentVal,
          fieldType,
          contextType,
          recordRef,
          conversationId,
          additionalContext,
          // Pass callback to get requestId immediately for cancellation
          onRequestId: (requestId: string) => {
            activeRequestIdRef.current = requestId;
          }
        });

        // Only update state if not cancelled and still mounted
        if (isMountedRef.current && !isCancelledRef.current) {
          // Save initial generation data for "Another variant"
          if (!initialGenerationRef.current) {
            initialGenerationRef.current = {
              originalValue: currentVal,
              quickActionId
            };
          }

          setResult({
            originalValue: currentVal,
            generatedValue: generatedResult.generatedValue || generatedResult.modifiedScript || '',
            explanation: generatedResult.explanation || ''
          });
        }
      } else {
        // Default: use TextAIService for text generation
        const response = await generateText({
          prompt: prompt || getDefaultPromptForAction(quickActionId, fieldType),
          quickAction: quickActionId,
          currentText: currentVal,
          selectedText,
          contentType: contextType,
          fieldType,
          recordRef,
          conversationId: conversationId || undefined
        });

        // Only update state if not cancelled and still mounted
        if (isMountedRef.current && !isCancelledRef.current) {
          // Save initial generation data for "Another variant"
          if (!initialGenerationRef.current) {
            initialGenerationRef.current = {
              originalValue: currentVal,
              quickActionId
            };
          }

          setResult({
            originalValue: currentVal,
            generatedValue: response.generatedText || '',
            explanation: response.explanation || ''
          });
        }
      }
    } catch (error) {
      // Check if this is a cancellation error (user cancelled or request was cancelled)
      const isCancellationError = isCancelledRef.current ||
        (error instanceof Error && error.message?.toLowerCase().includes('cancelled'));

      // Only log and show error if not a cancellation
      if (!isCancellationError) {
        console.error('AI generation error:', error);
        if (isMountedRef.current) {
          // Close the result popup on error
          setIsResultVisible(false);
          NotificationManager.error(
            t('ai-actions.error.generation', 'Failed to generate content'),
            t('ai-actions.error.title', 'Error')
          );
        }
      }
    } finally {
      if (isMountedRef.current && !isCancelledRef.current) {
        setIsGenerating(false);
      }
      // Clear request ID when generation completes
      activeRequestIdRef.current = null;
    }
  }, [isGenerating, getValue, onGenerateRequest, fieldType, contextType, recordRef, conversationId, additionalContext, selectedText]);

  /**
   * Handle quick action click
   */
  const handleQuickAction = useCallback((actionId: string) => {
    generate({ quickActionId: actionId });
  }, [generate]);

  /**
   * Handle prompt submit
   */
  const handlePromptSubmit = useCallback((prompt: string) => {
    generate({ prompt });
  }, [generate]);

  /**
   * Apply the generated result
   */
  const applyResult = useCallback(() => {
    if (!result.generatedValue || isApplying) return;

    setIsApplying(true);

    try {
      if (typeof setValue === 'function') {
        setValue(result.generatedValue);
      }
      closeResult();
    } catch (error) {
      console.error('Error applying result:', error);
      NotificationManager.error(
        t('ai-actions.error.apply', 'Failed to apply changes'),
        t('ai-actions.error.title', 'Error')
      );
    } finally {
      setIsApplying(false);
    }
  }, [result.generatedValue, isApplying, setValue, closeResult]);

  /**
   * Retry with new prompt (using current generated value as base)
   */
  const retryGeneration = useCallback(async (newPrompt: string) => {
    if (!newPrompt?.trim() || isGenerating) return;

    // Reset cancelled flag at start of new generation
    isCancelledRef.current = false;
    setIsGenerating(true);
    activeRequestIdRef.current = null;

    try {
      // Use current generated value as base for further edits
      const baseValue = result.generatedValue || result.originalValue;

      if (typeof onGenerateRequest === 'function') {
        const generatedResult = await onGenerateRequest({
          prompt: newPrompt,
          currentValue: baseValue,
          fieldType,
          contextType,
          recordRef,
          conversationId,
          additionalContext,
          // Pass callback to get requestId immediately for cancellation
          onRequestId: (requestId: string) => {
            activeRequestIdRef.current = requestId;
          }
        });

        // Only update state if not cancelled and still mounted
        if (isMountedRef.current && !isCancelledRef.current) {
          setResult({
            originalValue: baseValue,
            generatedValue: generatedResult.generatedValue || generatedResult.modifiedScript || '',
            explanation: generatedResult.explanation || ''
          });
        }
      } else {
        // Default: use TextAIService for text generation
        const response = await generateText({
          prompt: newPrompt,
          currentText: baseValue,
          selectedText,
          contentType: contextType,
          fieldType,
          recordRef,
          conversationId: conversationId || undefined
        });

        // Only update state if not cancelled and still mounted
        if (isMountedRef.current && !isCancelledRef.current) {
          setResult({
            originalValue: baseValue,
            generatedValue: response.generatedText || '',
            explanation: response.explanation || ''
          });
        }
      }
    } catch (error) {
      // Check if this is a cancellation error
      const isCancellationError = isCancelledRef.current ||
        (error instanceof Error && error.message?.toLowerCase().includes('cancelled'));

      if (!isCancellationError) {
        console.error('AI retry error:', error);
        if (isMountedRef.current) {
          NotificationManager.error(
            (error as Error).message || t('ai-actions.error.generation', 'Failed to generate content'),
            t('ai-actions.error.title', 'Error')
          );
        }
      }
    } finally {
      if (isMountedRef.current && !isCancelledRef.current) {
        setIsGenerating(false);
      }
      // Clear request ID when generation completes
      activeRequestIdRef.current = null;
    }
  }, [isGenerating, result, onGenerateRequest, fieldType, contextType, recordRef, conversationId, additionalContext, selectedText]);

  /**
   * Request another variant (regenerate using original value and quickAction)
   */
  const requestAnotherVariant = useCallback(async () => {
    if (isGenerating || !initialGenerationRef.current) return;

    // Reset cancelled flag at start of new generation
    isCancelledRef.current = false;
    setIsGenerating(true);
    activeRequestIdRef.current = null;

    try {
      const { originalValue, quickActionId } = initialGenerationRef.current;

      if (typeof onGenerateRequest === 'function') {
        const generatedResult = await onGenerateRequest({
          prompt: t('ai-actions.prompt.another-variant', 'Generate another variant'),
          quickActionId, // Use original quickAction
          currentValue: originalValue, // Use original value
          fieldType,
          contextType,
          recordRef,
          conversationId,
          additionalContext,
          // Pass callback to get requestId immediately for cancellation
          onRequestId: (requestId: string) => {
            activeRequestIdRef.current = requestId;
          }
        });

        // Only update state if not cancelled and still mounted
        if (isMountedRef.current && !isCancelledRef.current) {
          setResult(prev => ({
            ...prev,
            generatedValue: generatedResult.generatedValue || generatedResult.modifiedScript || '',
            explanation: generatedResult.explanation || ''
          }));
        }
      } else {
        // Default: use TextAIService for text generation
        const response = await generateText({
          prompt: t('ai-actions.prompt.another-variant', 'Generate another variant'),
          quickAction: quickActionId,
          currentText: originalValue,
          selectedText,
          contentType: contextType,
          fieldType,
          recordRef,
          conversationId: conversationId || undefined
        });

        // Only update state if not cancelled and still mounted
        if (isMountedRef.current && !isCancelledRef.current) {
          setResult(prev => ({
            ...prev,
            generatedValue: response.generatedText || '',
            explanation: response.explanation || ''
          }));
        }
      }
    } catch (error) {
      // Check if this is a cancellation error
      const isCancellationError = isCancelledRef.current ||
        (error instanceof Error && error.message?.toLowerCase().includes('cancelled'));

      if (!isCancellationError) {
        console.error('AI another variant error:', error);
        if (isMountedRef.current) {
          NotificationManager.error(
            (error as Error).message || t('ai-actions.error.generation', 'Failed to generate content'),
            t('ai-actions.error.title', 'Error')
          );
        }
      }
    } finally {
      if (isMountedRef.current && !isCancelledRef.current) {
        setIsGenerating(false);
      }
      activeRequestIdRef.current = null;
    }
  }, [isGenerating, onGenerateRequest, fieldType, contextType, recordRef, conversationId, additionalContext, selectedText]);

  return {
    // State
    isAvailable,
    isActionsBarVisible,
    isResultVisible,
    isGenerating,
    isApplying,
    result,
    conversationId,

    // Configuration
    fieldConfig,
    availableActions,

    // Actions
    openActionsBar,
    closeActionsBar,
    closeResult,
    cancelGeneration,
    handleQuickAction,
    handlePromptSubmit,
    applyResult,
    retryGeneration,
    requestAnotherVariant
  };
};

/**
 * Get default prompt for a quick action
 */
function getDefaultPromptForAction(actionId: string | undefined, fieldType: string): string {
  const prompts: Record<string, string> = {
    'improve': t('ai-actions.prompt.improve', 'Improve this text'),
    'translate': t('ai-actions.prompt.translate', 'Translate to English'),
    'expand': t('ai-actions.prompt.expand', 'Expand and add more details'),
    'summarize': t('ai-actions.prompt.summarize', 'Summarize this text'),
    'fix-grammar': t('ai-actions.prompt.fix-grammar', 'Fix grammar and spelling'),
    'explain': t('ai-actions.prompt.explain', 'Explain what this code does'),
    'fix': t('ai-actions.prompt.fix', 'Find and fix errors in this code'),
    'optimize': t('ai-actions.prompt.optimize', 'Optimize this code'),
    'add-comments': t('ai-actions.prompt.add-comments', 'Add comments to this code')
  };

  return prompts[actionId || ''] || prompts['generate'];
}

export default useAIFieldActions;
