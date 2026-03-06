/**
 * AIPopperWrapper Component
 * Wrapper that provides smart positioning for AI popup components
 * Uses Popper.js for automatic flip and collision detection
 * Supports "sticky" mode for floating toolbars where reference may unmount
 */

import { Placement, Modifier } from '@popperjs/core';
import classNames from 'classnames';
import React, { useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { usePopper } from 'react-popper';

import { ContentType } from '../config/fieldActionConfigs';

import { CONTENT_TYPES } from '@/components/AIAssistant/constants';

type PositionVariant = 'text-field' | 'script-editor' | 'lexical';

/**
 * Content metrics for adaptive width calculation
 */
interface ContentMetrics {
  contentLength?: number;
  contentType?: ContentType;
  hasExplanation?: boolean;
}

/**
 * Calculate adaptive width based on content metrics
 * Uses text length estimation to determine optimal popup width
 */
const calculateContentBasedWidth = (metrics: ContentMetrics, minWidth: number, maxWidthValue: number): number => {
  const { contentLength = 0, contentType, hasExplanation } = metrics;

  // Base width is the effective minimum
  const baseWidth = Math.max(minWidth, 400);

  // If no content, return base width
  if (contentLength === 0) {
    return baseWidth;
  }

  // Estimate number of lines based on ~55 characters per line
  const charsPerLine = contentType === CONTENT_TYPES.CODE ? 60 : 55;
  const linesEstimate = contentLength / charsPerLine;

  let contentWidth: number;

  if (linesEstimate < 3) {
    // Short content - use minimum width
    contentWidth = baseWidth;
  } else if (linesEstimate < 10) {
    // Medium content - moderate width
    contentWidth = 500;
  } else if (linesEstimate < 25) {
    // Longer content - wider
    contentWidth = 600;
  } else {
    // Very long content - maximum reasonable width
    contentWidth = 700;
  }

  // Code needs extra width for readability
  if (contentType === CONTENT_TYPES.CODE) {
    contentWidth += 50;
  }

  // Explanation block requires minimum space
  if (hasExplanation) {
    contentWidth = Math.max(contentWidth, 500);
  }

  // Clamp to min/max bounds
  return Math.max(baseWidth, Math.min(contentWidth, maxWidthValue));
};

interface VirtualReference {
  getBoundingClientRect: () => DOMRect;
}

/**
 * Popper modifiers for smart positioning
 * @param isPlacementLocked - When true, disables flip to prevent position jumping during content changes
 */
const createModifiers = (
  variant: PositionVariant,
  minWidth: number,
  maxWidth?: string,
  contentMetrics?: ContentMetrics,
  isPlacementLocked?: boolean
): Partial<Modifier<string, object>>[] => [
  {
    name: 'flip',
    // Disable flip after initial positioning to prevent jumps when content changes
    enabled: !isPlacementLocked,
    options: {
      // Reduced fallback placements - only flip vertically, not horizontally
      fallbackPlacements: ['top-start', 'bottom-start'],
      // Don't flip between variations (e.g., top-start to top-end)
      flipVariations: false,
      padding: 24
    }
  },
  {
    name: 'preventOverflow',
    enabled: true,
    options: {
      padding: 24,
      boundary: 'viewport',
      altAxis: true,
      tether: false
    }
  },
  {
    name: 'offset',
    enabled: true,
    options: {
      offset: [0, 8]
    }
  },
  {
    name: 'computeStyles',
    options: {
      adaptive: true,
      gpuAcceleration: false // Prevents blurry text
    }
  },
  // Custom modifier for width constraints
  {
    name: 'sizeConstraints',
    enabled: true,
    phase: 'beforeWrite',
    requires: ['computeStyles'],
    fn: ({ state }) => {
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth < 768;
      const rightEdgePadding = isMobile ? 8 : 24; // Smaller padding on mobile

      if (variant === 'text-field') {
        // Match reference width for text fields, with minimum 400px
        const refWidth = state.rects.reference.width;
        const effectiveMinWidth = Math.max(minWidth, 400);
        const maxWidthValue = parseInt(maxWidth || '800', 10) || 800;

        // Calculate content-aware width
        const contentBasedWidth = contentMetrics
          ? calculateContentBasedWidth(contentMetrics, effectiveMinWidth, maxWidthValue)
          : effectiveMinWidth;

        // Final width: max of reference width and content-based width, clamped to maxWidth
        let finalWidth = Math.min(Math.max(refWidth, contentBasedWidth), maxWidthValue);

        // For CODE content, use vw-based width for better readability
        if (contentMetrics?.contentType === CONTENT_TYPES.CODE && !isMobile) {
          const vwBasedWidth = viewportWidth * 0.6 - rightEdgePadding * 2;
          finalWidth = Math.max(finalWidth, vwBasedWidth);
        }

        // Ensure popup doesn't extend beyond right edge with padding
        const popperLeft = state.modifiersData.popperOffsets?.x || state.rects.reference.x;
        const availableWidth = viewportWidth - popperLeft - rightEdgePadding;
        finalWidth = Math.min(finalWidth, availableWidth);

        state.styles.popper.minWidth = `${Math.min(effectiveMinWidth, availableWidth)}px`;
        state.styles.popper.width = `${finalWidth}px`;
        state.styles.popper.maxWidth = `calc(60vw - ${rightEdgePadding * 2}px)`;
      } else if (variant === 'script-editor') {
        if (isMobile) {
          const popperLeft = state.modifiersData.popperOffsets?.x || state.rects.reference.x;
          const availableWidth = viewportWidth - popperLeft - rightEdgePadding;
          const constrainedWidth = Math.max(availableWidth, 280);

          state.styles.popper.minWidth = `${constrainedWidth}px`;
          state.styles.popper.width = `${constrainedWidth}px`;
          state.styles.popper.maxWidth = `${constrainedWidth}px`;

          if (state.styles.popper.right !== undefined) {
            delete state.styles.popper.right;
          }
        } else {
          state.styles.popper.minWidth = '600px';
          state.styles.popper.maxWidth = `calc(60vw - ${rightEdgePadding * 2}px)`;
        }
      } else if (variant === 'lexical') {
        state.styles.popper.minWidth = '450px';
        state.styles.popper.maxWidth = '600px';
      }
    }
  }
];

/**
 * Get preferred placement based on variant
 */
const getPlacementForVariant = (variant: PositionVariant): Placement => {
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    return 'bottom-start';
  }

  switch (variant) {
    case 'script-editor':
      return 'bottom-end';
    case 'lexical':
      return 'bottom-end';
    case 'text-field':
    default:
      return 'bottom-start';
  }
};

/**
 * Create a virtual reference element from stored rect
 * Used when the actual reference element unmounts but popup should stay
 */
const createVirtualReference = (rect: DOMRect): VirtualReference => ({
  getBoundingClientRect: () => rect
});

export interface AIPopperWrapperProps {
  isVisible?: boolean;
  referenceElement?: HTMLElement | null;
  portalContainer?: HTMLElement | null;
  variant?: PositionVariant;
  placement?: Placement;
  minWidth?: number;
  maxWidth?: string;
  className?: string;
  children?: ReactNode;
  onPlacementChange?: (placement: Placement) => void;
  stickyPosition?: boolean;
  // Content metrics for adaptive width calculation
  contentLength?: number;
  contentType?: ContentType;
  hasExplanation?: boolean;
}

const AIPopperWrapper: React.FC<AIPopperWrapperProps> = ({
  isVisible = false,
  referenceElement,
  portalContainer,
  variant = 'text-field',
  placement: placementOverride,
  minWidth = 450,
  maxWidth,
  className,
  children,
  onPlacementChange,
  stickyPosition = false,
  contentLength,
  contentType,
  hasExplanation
}) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // Store last known rect for sticky positioning
  const lastRectRef = useRef<DOMRect | null>(null);
  // Store virtual reference element
  const virtualRefRef = useRef<VirtualReference | null>(null);
  // Track if placement has been locked after initial positioning
  // This prevents "jumping" when content changes (e.g., switching tabs)
  const [isPlacementLocked, setIsPlacementLocked] = useState(false);
  // Track if we've done initial positioning
  const hasInitiallyPositionedRef = useRef(false);

  // Determine placement
  const preferredPlacement = placementOverride || getPlacementForVariant(variant);

  // Create content metrics object for width calculation
  const contentMetrics = useMemo(
    (): ContentMetrics | undefined =>
      contentLength !== undefined || contentType !== undefined || hasExplanation !== undefined
        ? { contentLength, contentType, hasExplanation }
        : undefined,
    [contentLength, contentType, hasExplanation]
  );

  // Create modifiers - pass isPlacementLocked to disable flip after initial positioning
  const modifiers = useMemo(
    () => createModifiers(variant, minWidth, maxWidth, contentMetrics, isPlacementLocked),
    [variant, minWidth, maxWidth, contentMetrics, isPlacementLocked]
  );

  // Save reference rect when available
  useEffect(() => {
    if (referenceElement && isVisible) {
      lastRectRef.current = referenceElement.getBoundingClientRect();
    }
  }, [referenceElement, isVisible]);

  // Determine effective reference element
  const effectiveReference = useMemo((): HTMLElement | VirtualReference | null => {
    if (referenceElement) {
      virtualRefRef.current = null;
      return referenceElement;
    }
    // Use virtual reference if sticky mode and we have stored rect
    if (stickyPosition && lastRectRef.current && isVisible) {
      if (!virtualRefRef.current) {
        virtualRefRef.current = createVirtualReference(lastRectRef.current);
      }
      return virtualRefRef.current;
    }
    return null;
  }, [referenceElement, stickyPosition, isVisible]);

  // Use Popper for positioning
  const { styles, attributes, state, update } = usePopper(isVisible ? effectiveReference : null, isVisible ? popperElement : null, {
    placement: preferredPlacement,
    modifiers: modifiers as Modifier<string, object>[],
    strategy: 'fixed' // Use fixed for portal rendering
  });

  // Get actual placement after potential flip
  const actualPlacement = state?.placement || preferredPlacement;

  // Update position when visibility or content changes
  useEffect(() => {
    if (isVisible && update) {
      // Initial update after render
      update();
      // Additional update after a frame to catch late content renders
      // Then lock placement to prevent jumping during content changes
      const frameId = requestAnimationFrame(() => {
        update().then(() => {
          // Lock placement after initial positioning is complete
          // This prevents flip from changing position when tabs are switched
          if (!hasInitiallyPositionedRef.current) {
            hasInitiallyPositionedRef.current = true;
            setIsPlacementLocked(true);
          }
        });
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [isVisible, update, contentMetrics]);

  // ResizeObserver to handle content size changes
  useEffect(() => {
    if (!popperElement || !isVisible || !update) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      update();
    });

    resizeObserver.observe(popperElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [popperElement, isVisible, update]);

  // Notify parent about placement changes
  useEffect(() => {
    if (onPlacementChange && actualPlacement) {
      onPlacementChange(actualPlacement);
    }
  }, [actualPlacement, onPlacementChange]);

  // Clear stored rect and reset placement lock when popup closes
  useEffect(() => {
    if (!isVisible) {
      // Delay clearing to allow for quick re-open
      const timer = setTimeout(() => {
        lastRectRef.current = null;
        virtualRefRef.current = null;
        // Reset placement lock so next open can determine optimal position
        hasInitiallyPositionedRef.current = false;
        setIsPlacementLocked(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Don't render if not visible or no reference (real or virtual)
  if (!isVisible || !effectiveReference) {
    return null;
  }

  // Determine animation direction based on placement
  const isTop = actualPlacement?.startsWith('top');

  const content = (
    <div
      ref={setPopperElement}
      style={{
        ...styles.popper,
        zIndex: 120000
      }}
      {...attributes.popper}
      className={classNames(
        'ai-popper',
        {
          'ai-popper--top': isTop,
          'ai-popper--bottom': !isTop,
          'ai-popper--visible': isVisible
        },
        className
      )}
      data-placement={actualPlacement}
    >
      {children}
    </div>
  );

  // Always render to body for proper stacking context
  const container = portalContainer || document.body;
  return ReactDOM.createPortal(content, container);
};

export default AIPopperWrapper;
