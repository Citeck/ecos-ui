import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import additionalContextService from '../AdditionalContextService';
import { isSameRecordRef } from '../utils';

import { ADDITIONAL_CONTEXT_TYPES, AUTOCOMPLETE_QUERY_THRESHOLD } from '@/components/ai/AIAssistant/constants';
import { t } from '@/helpers/export/util';

// Vertical gap between the @ autocomplete list and the input field, px.
const AUTOCOMPLETE_GAP = 8;
// Below this free height (~three list rows) the list is unreadable, so it flips under the field.
const AUTOCOMPLETE_MIN_HEIGHT = 90;
// Mirrors the max-height in _autocomplete.scss; the computed value may only narrow it.
const AUTOCOMPLETE_MAX_HEIGHT = 200;

// A shared constant rather than a `= []` default: a fresh literal per call is a fresh identity, and
// it is a dependency of the option-list memo — the list would then be rebuilt on every render, which
// is the very thing the memo exists to stop.
const NO_ARTIFACTS = [];

/**
 * Hook for managing @ autocomplete functionality
 * @param {Object} options - Configuration options
 * @param {Function} options.getAdditionalContext - Function to get additional context
 * @param {Function} options.toggleAdditionalContext - Function to toggle context
 * @param {Function} options.addRecordToContext - Function to add record to context
 * @param {Object} options.additionalContext - Current additional context state
 * @param {string[]} options.selectedAdditionalContext - Selected context types
 * @param {Array<Object>} options.autoContextArtifacts - Auto-context artifacts ({ ref, ... }) already shown as chips
 * @param {boolean} options.isPanelVisible - Whether the chat panel itself is on screen; the list is closed when it is not
 * @returns {Object} Autocomplete state and handlers
 */
const useAutocomplete = (options = {}) => {
  const {
    getAdditionalContext,
    toggleAdditionalContext,
    addRecordToContext,
    addDocumentToContext,
    additionalContext,
    selectedAdditionalContext,
    autoContextArtifacts = NO_ARTIFACTS,
    isPanelVisible = true
  } = options;

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  // The shape mirrors what handleAutocompleteInputChange computes ({ left, bottom } or
  // { left, top }); the initial value never reaches the screen — the position is recalculated
  // synchronously before the list is switched on.
  const [autocompletePosition, setAutocompletePosition] = useState({ left: 0, bottom: 0 });
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [currentRecordForAutocomplete, setCurrentRecordForAutocomplete] = useState(null);
  // -1 is «nothing picked», and it is the state the list opens in. Starting at 0 meant a variant was
  // always pre-selected the moment an `@` was typed, so `Enter` had no way of meaning «send»: a
  // message that merely mentions somebody («@Иванов, посмотри») was turned into a context chip
  // instead of being sent (D-B-23). A variant becomes current only when the user makes it so — with
  // the arrow keys, or with `Tab`, which completes the first match in one press.
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState([]);

  const searchTimeoutRef = useRef(null);
  // Inputs of the last position calculation, kept so the same calculation can be repeated after the
  // render the keystroke schedules — see the re-measure effect below.
  const positionInputsRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search records by display name
  const searchRecordsByDisp = useCallback(async (query, type) => {
    if (!query || query.length < AUTOCOMPLETE_QUERY_THRESHOLD) {
      return [];
    }

    setIsSearching(true);

    try {
      const results = await additionalContextService.searchRecordsByDisp(query, type);
      setIsSearching(false);
      return results || [];
    } catch (error) {
      console.error('Error searching records:', error);
      setIsSearching(false);
      return [];
    }
  }, []);

  // Places the list against the field's current rectangle. Nothing here waits for data — only the
  // field's rectangle, the text before the cursor and the window size — so it can be called
  // synchronously from the change handler, before the list is switched on (D-405-4).
  const measureAutocompletePosition = useCallback((textareaElement, textBeforeCursor) => {
    if (!textareaElement) {
      return;
    }

    const rect = textareaElement.getBoundingClientRect();
    const lines = textBeforeCursor.split('\n');
    const currentLineText = lines[lines.length - 1];

    const charWidth = 8;
    const padding = 12;

    const left = Math.min(rect.left + padding + currentLineText.length * charWidth, window.innerWidth - 300);

    // The list is anchored by its bottom edge just above the field, not by its top edge:
    // the input sits at the bottom of the panel, and the previous top-anchored formula with
    // its `window.innerHeight - 200` cap dropped the list right onto the field (D-405-4).
    const spaceAbove = rect.top - AUTOCOMPLETE_GAP;
    if (spaceAbove >= AUTOCOMPLETE_MIN_HEIGHT) {
      setAutocompletePosition({
        left,
        bottom: window.innerHeight - rect.top + AUTOCOMPLETE_GAP,
        maxHeight: Math.min(spaceAbove, AUTOCOMPLETE_MAX_HEIGHT)
      });
    } else {
      // Not enough room above the field. Cutting maxHeight cannot help here: the bottom
      // edge stays glued to the field, so a smaller height only moves the top edge — the
      // list would still poke past the window top. Flip it under the field instead.
      setAutocompletePosition({
        left,
        top: rect.bottom + AUTOCOMPLETE_GAP,
        maxHeight: Math.min(window.innerHeight - rect.bottom - AUTOCOMPLETE_GAP, AUTOCOMPLETE_MAX_HEIGHT)
      });
    }
  }, []);

  // The field grows with the text: `ChatInput` sets its height from `scrollHeight` in an effect, so
  // the rectangle measured synchronously inside the change handler still describes the field one
  // line shorter on the keystroke that wraps — and the list, anchored to that stale top edge, lands
  // on the field's new first line, which is the defect the anchoring was changed for. Re-measure
  // after the render. This hook is used by `AIAssistantChat`, the parent of `ChatInput`, so its
  // effects run after the child's resize effect and see the final height (D-405-4).
  useEffect(() => {
    if (!showAutocomplete || !positionInputsRef.current) {
      return;
    }

    const { textareaElement, textBeforeCursor } = positionInputsRef.current;
    measureAutocompletePosition(textareaElement, textBeforeCursor);
  }, [showAutocomplete, autocompleteQuery, measureAutocompletePosition]);

  // Handle input change for autocomplete
  const handleAutocompleteInputChange = useCallback(
    async (value, cursorPosition, textareaElement) => {
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const queryAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

        if (queryAfterAt.length >= 0 && !queryAfterAt.includes(' ')) {
          // The position must be known before setShowAutocomplete(true) below: the awaits that
          // follow give the list a chance to render (the current record alone is enough to show
          // something), and until the calculation ran it would render wherever the previous input
          // left it.
          positionInputsRef.current = { textareaElement, textBeforeCursor };
          measureAutocompletePosition(textareaElement, textBeforeCursor);

          setAutocompleteQuery(queryAfterAt);
          setSelectedAutocompleteIndex(-1);
          setShowAutocomplete(true);

          // Load current record for autocomplete
          if (getAdditionalContext) {
            const data = await getAdditionalContext(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD);
            setCurrentRecordForAutocomplete(data);

            // Search for records if query length exceeds threshold
            if (queryAfterAt.length >= AUTOCOMPLETE_QUERY_THRESHOLD && data && data.type) {
              const results = await searchRecordsByDisp(queryAfterAt, data.type);
              setSearchResults(results);
            } else {
              setSearchResults([]);
            }

            // Load available documents
            const docs = await getAdditionalContext(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS);
            setAvailableDocuments(docs || []);
          }
        } else {
          hideAutocomplete();
        }
      } else {
        hideAutocomplete();
      }
    },
    [getAdditionalContext, searchRecordsByDisp, measureAutocompletePosition]
  );

  // Hide autocomplete
  const hideAutocomplete = useCallback(() => {
    setShowAutocomplete(false);
    setSelectedAutocompleteIndex(-1);
    setSearchResults([]);
    setAvailableDocuments([]);
    // The measured field goes with the list. This hook is mounted on every page, and minimizing the
    // panel unmounts the input form (`AIAssistantChat` renders it behind `!isMinimized`) while the
    // reference kept here would hold the detached `<textarea>` for the rest of the page's life. A
    // stale node is also unusable: `getBoundingClientRect()` on it reads all zeros, and the list
    // would be placed against the top-left corner of the window rather than the field.
    positionInputsRef.current = null;
  }, []);

  // The list is rendered outside the panel's `isMinimized` guard (AIAssistantChat.jsx) and is
  // positioned `fixed` against the input field's last measured rectangle, so minimizing or closing
  // the panel with an open `@` list would leave the list floating over the page, anchored to a
  // field that is no longer on screen. Nothing else takes it down: there is no click-outside
  // handler, and once the input is gone Escape reaches the panel's own document handler instead of
  // the list's. Since D-405-4 anchors the list by its bottom edge, the orphan also lands somewhere
  // unrelated to where it was.
  useEffect(() => {
    if (!isPanelVisible) {
      hideAutocomplete();
    }
  }, [isPanelVisible, hideAutocomplete]);

  // The `@` list as it is drawn. A value rather than a factory: the list is read both while
  // rendering the panel and again inside the key handler on every keystroke, and each reading used to
  // redo the whole `options × context` sweep of `isSameRecordRef` comparisons. Computed once per
  // change of the inputs, the two readings also cannot disagree about what the list holds.
  const filteredAutocompleteOptions = useMemo(() => {
    const options = [];
    const query = autocompleteQuery.toLowerCase();

    const contextRecords = additionalContext?.records || [];
    const contextDocuments = additionalContext?.documents || [];

    // Every branch below checks two collections at once: the manually picked context
    // (additionalContext) and the auto-context artifacts the server attached to a response — those
    // live in useUniversalChat, not here, but are shown to the user as chips all the same, so an
    // entity present in either collection must not be offered again (picking it would end in two
    // chips for one record, D-405-1). References are compared with isSameRecordRef rather than
    // `===`: each side stores the reference as its source wrote it — with or without the
    // application prefix — so plain string equality misses exactly the record it is looking for.
    const inAutoContext = ref => autoContextArtifacts.some(artifact => isSameRecordRef(artifact.ref, ref));

    // References of everything already listed, so that the same entity is never offered twice: the
    // search runs by the type of the current record (see handleAutocompleteInputChange), so the
    // current record itself is a regular member of its own result set, and the server may return the
    // same record more than once across pages of a fast-changing journal. Documents share the list
    // for the same reason — they are loaded for the current record and may name it or one of the
    // search results, and the two rows would then add one entity to two different context
    // collections.
    const listedRecordRefs = [];

    // Add current record option
    if (currentRecordForAutocomplete) {
      const recordLabel = currentRecordForAutocomplete.displayName || t('ai-assistant.autocomplete.current-record');
      const alreadyInContext =
        contextRecords.some(r => isSameRecordRef(r.recordRef, currentRecordForAutocomplete.recordRef)) ||
        inAutoContext(currentRecordForAutocomplete.recordRef);
      if (!alreadyInContext && (!query || recordLabel.toLowerCase().includes(query))) {
        options.push({
          type: ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD,
          label: recordLabel,
          icon: 'fa-file-text-o',
          data: currentRecordForAutocomplete
        });
        listedRecordRefs.push(currentRecordForAutocomplete.recordRef);
      }
    }

    // Add search results
    searchResults.forEach(result => {
      const alreadyInContext = contextRecords.some(r => isSameRecordRef(r.recordRef, result.recordRef)) || inAutoContext(result.recordRef);
      const alreadyListed = listedRecordRefs.some(ref => isSameRecordRef(ref, result.recordRef));
      if (!alreadyInContext && !alreadyListed) {
        options.push({
          type: 'search_result',
          label: result.displayName || result.recordRef,
          icon: 'fa-search',
          data: result
        });
        listedRecordRefs.push(result.recordRef);
      }
    });

    // Add available documents
    availableDocuments.forEach(doc => {
      const alreadyInContext = contextDocuments.some(d => isSameRecordRef(d.recordRef, doc.recordRef)) || inAutoContext(doc.recordRef);
      const alreadyListed = listedRecordRefs.some(ref => isSameRecordRef(ref, doc.recordRef));
      if (!alreadyInContext && !alreadyListed) {
        const docLabel = doc.displayName || doc.recordRef;
        if (!query || docLabel.toLowerCase().includes(query)) {
          options.push({
            type: ADDITIONAL_CONTEXT_TYPES.DOCUMENTS,
            label: docLabel,
            icon: 'fa-file-o',
            data: doc
          });
          listedRecordRefs.push(doc.recordRef);
        }
      }
    });

    return options;
  }, [autocompleteQuery, currentRecordForAutocomplete, searchResults, availableDocuments, additionalContext, autoContextArtifacts]);

  // Insert context mention into message
  const insertContextMention = useCallback(
    async (contextType, recordData, currentMessage, setMessage, textareaRef) => {
      let contextLabel = t('ai-assistant.autocomplete.record-fallback');
      let contextDataToAdd = null;

      if (contextType === 'search_result' && recordData) {
        contextLabel = recordData.displayName || recordData.recordRef;
        contextDataToAdd = recordData;
      } else if (contextType === ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD) {
        const contextData = recordData || (getAdditionalContext ? await getAdditionalContext(contextType) : null);
        if (contextData) {
          contextLabel = contextData.displayName || contextData.recordRef || t('ai-assistant.autocomplete.record-fallback');
          contextDataToAdd = contextData;
        }
      } else if (contextType === ADDITIONAL_CONTEXT_TYPES.DOCUMENTS && recordData) {
        contextLabel = recordData.displayName || recordData.recordRef;
        contextDataToAdd = recordData;
      } else if (contextType === ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES && recordData) {
        contextLabel = recordData.displayName || recordData.attribute;
        contextDataToAdd = recordData;
      }

      // Replace @ mention with context label
      const cursorPosition = textareaRef?.current?.selectionStart ?? currentMessage.length;
      const textBeforeCursor = currentMessage.substring(0, cursorPosition);
      const textAfterCursor = currentMessage.substring(cursorPosition);

      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      if (lastAtIndex === -1) {
        hideAutocomplete();
        return;
      }

      const newText = textBeforeCursor.substring(0, lastAtIndex) + `@${contextLabel} ` + textAfterCursor;

      setMessage(newText);
      hideAutocomplete();

      // Set cursor position after the inserted mention
      setTimeout(() => {
        if (textareaRef?.current) {
          const newCursorPosition = lastAtIndex + contextLabel.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);

      // Add context data to additional context
      if (contextDataToAdd) {
        if (contextType === 'search_result') {
          addRecordToContext?.(contextDataToAdd);
        } else if (contextType === ADDITIONAL_CONTEXT_TYPES.DOCUMENTS) {
          addDocumentToContext?.(contextDataToAdd);
        } else if (contextType === ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES) {
          // Attributes handled separately
        } else {
          toggleAdditionalContext?.(contextType);
        }
      }
    },
    [getAdditionalContext, toggleAdditionalContext, addRecordToContext, addDocumentToContext, hideAutocomplete]
  );

  // The spinner row stands in for the list while a search runs, so the list is on screen with no
  // options too. Keyed on the same threshold that starts the search, or a two-character query would
  // search with nothing drawn.
  const isSearchIndicatorVisible = isSearching && autocompleteQuery.length >= AUTOCOMPLETE_QUERY_THRESHOLD;

  // Whether the list is actually drawn — `AIAssistantChat` renders it under exactly this condition,
  // and the key handler below has to agree with it. `showAutocomplete` alone is not that answer: an
  // `@` whose query matches nothing leaves it true with the list rendering nothing, and keys must
  // then pass through to the chat. Otherwise Escape is swallowed with nothing on screen (the panel
  // stays open and the press reads as a dead key, D-405-5), and Enter never sends a message whose
  // text merely contains an address — «напиши на a@b.com». `isPanelVisible` is part of the
  // predicate too: the hide-on-minimize effect above runs only after paint, so without it the
  // render that minimizes the panel would still draw the list for one frame, orphaned at the
  // coordinates of an input field that is no longer on screen.
  const isAutocompleteListVisible = useCallback(
    filteredOptions => isPanelVisible && showAutocomplete && (isSearchIndicatorVisible || (filteredOptions || []).length > 0),
    [isPanelVisible, showAutocomplete, isSearchIndicatorVisible]
  );

  // Handle keyboard navigation in autocomplete
  const handleAutocompleteKeyDown = useCallback(
    (e, filteredOptions) => {
      if (!isAutocompleteListVisible(filteredOptions)) return false;

      if (e.key === 'Escape') {
        // The panel's own Escape handler sits on `document` (useWindowManagement.js:28) and closes
        // the whole chat unconditionally, so an Escape already consumed here must not reach it —
        // one press closes the list, the next one the panel (D-405-5). Stopping propagation from a
        // React handler works because the app mounts through createRoot and the chat renders into a
        // body-level portal: React 18 attaches its delegated listeners to the portal container,
        // i.e. below `document`, so the native event is stopped before it bubbles that far.
        e.stopPropagation();
        hideAutocomplete();
        return true;
      }

      if (filteredOptions.length === 0) {
        // The search is still running — the guard above let us in on the spinner alone. `Tab` is
        // swallowed: it has nothing to complete yet, and letting it through would carry the focus
        // out of a half-typed mention. `Enter` is not: swallowing it left the key simply dead for
        // as long as the search took, and the search is exactly when the user is most likely to
        // give up on the list and send what they have already written (D-B-23).
        if (e.key === 'Tab') {
          e.preventDefault();
          return true;
        }
        return false;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        return true;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        return true;
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        // Nothing picked yet. `Enter` then belongs to the form — the list is open on every `@`, and
        // the user may well be writing a message that only mentions a name. `Tab` has nothing else
        // to do here, so it completes the first match: one press, no arrow keys (D-B-23).
        if (selectedAutocompleteIndex < 0) {
          if (e.key !== 'Tab') {
            return false;
          }
          e.preventDefault();
          return filteredOptions[0];
        }

        e.preventDefault();
        const safeIndex = Math.min(selectedAutocompleteIndex, filteredOptions.length - 1);
        const selectedOption = filteredOptions[safeIndex];
        if (selectedOption) {
          return selectedOption;
        }
        return true;
      }

      return false;
    },
    [isAutocompleteListVisible, selectedAutocompleteIndex, hideAutocomplete]
  );

  return {
    // State
    showAutocomplete,
    autocompletePosition,
    autocompleteQuery,
    selectedAutocompleteIndex,
    searchResults,
    isSearching,
    isSearchIndicatorVisible,
    availableDocuments,
    currentRecordForAutocomplete,
    filteredAutocompleteOptions,

    // Actions
    handleAutocompleteInputChange,
    hideAutocomplete,
    isAutocompleteListVisible,
    insertContextMention,
    handleAutocompleteKeyDown,
    setSelectedAutocompleteIndex
  };
};

export default useAutocomplete;
