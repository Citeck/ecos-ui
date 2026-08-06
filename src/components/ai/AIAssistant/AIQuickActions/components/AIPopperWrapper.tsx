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

import { CONTENT_TYPES } from '@/components/ai/AIAssistant/constants';

type PositionVariant = 'text-field' | 'script-editor' | 'lexical';

/** Gap kept between the popup and the window edge; matches `preventOverflow`'s padding */
const VIEWPORT_PADDING = 24;

/** Floor for a viewport-capped popup, so a very narrow window cannot collapse it to a sliver */
const MIN_POPPER_WIDTH = 280;

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
 * Horizontal position that keeps a popup of `popperWidth` inside its field.
 *
 * Exported for tests — this is the whole of the D-B-1 fix: the popups are anchored to the small
 * trigger button, so a `*-end` placement sent a 600px popup far to the left of the field and the
 * viewport-bound preventOverflow only stopped it at the window edge. When the popup is wider than
 * the field it is aligned to the field's start: the beginning of the text matters most.
 */
export const clampToFieldBounds = (
  x: number,
  popperWidth: number,
  field: { left: number; right: number },
  viewportWidth?: number
): number => {
  // `sizeConstraints` caps the popup to the field in the same update pass, but it runs later
  // (`beforeWrite`) than this clamp (`main`), so `popperWidth` is still the pre-cap measurement.
  // It makes no difference to the field bounds themselves (a popup wider than its field lands on
  // `field.left` either way), but the viewport arithmetic below would reserve room for a width the
  // popup is never going to have.
  const fieldWidth = Math.max(field.right - field.left, 0);
  const width = fieldWidth ? Math.min(popperWidth, fieldWidth) : popperWidth;

  let minX = field.left;
  let maxX = Math.max(field.left, field.right - width);

  // A field can itself hang outside the window — horizontally scrolled, or wider than a narrow
  // window. Staying inside the field must never push the popup off-screen, so the viewport wins:
  // this modifier runs after `preventOverflow` and would otherwise silently undo its clamp.
  if (viewportWidth) {
    const viewportMin = VIEWPORT_PADDING;
    const viewportMax = Math.max(viewportMin, viewportWidth - width - VIEWPORT_PADDING);

    minX = Math.min(Math.max(minX, viewportMin), viewportMax);
    maxX = Math.min(Math.max(maxX, minX), viewportMax);
  }

  return Math.min(Math.max(x, minX), maxX);
};

/**
 * Width for a popup that must fit inside BOTH its field and the window.
 *
 * Exported for tests. Capping to the field alone is not enough for a variant whose field is
 * routinely as wide as its container (a rich-text editor): on a narrow screen the field cap gives
 * back the whole viewport width, while `clampToFieldBounds` has already reserved padding on the
 * left, so the popup overhangs the right edge by exactly that padding.
 */
export const clampPopupWidth = (
  desired: number,
  bounds: { fieldWidth?: number; viewportWidth: number; popperLeft: number; edgePadding: number }
): number => {
  const { fieldWidth, viewportWidth, popperLeft, edgePadding } = bounds;
  const available = Math.max(viewportWidth - popperLeft - edgePadding, MIN_POPPER_WIDTH);
  const cappedToField = fieldWidth ? Math.min(desired, fieldWidth) : desired;

  return Math.min(cappedToField, available);
};

/**
 * Popper modifiers for smart positioning
 * @param isPlacementLocked - When true, disables flip to prevent position jumping during content changes
 */
const createModifiers = (
  variant: PositionVariant,
  minWidth: number,
  maxWidth?: string,
  contentMetrics?: ContentMetrics,
  isPlacementLocked?: boolean,
  boundaryElement?: HTMLElement | null
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
  // Keep the popup inside the field it belongs to. The reference element is the small trigger
  // button, so with a `*-end` placement a 600px popup starts far to the left of the field and the
  // viewport-bound preventOverflow above only stops it at the window edge — it still covers the
  // side menu and the first characters of every line being edited. Runs after preventOverflow and
  // shifts the popup back inside the field's horizontal bounds. Width is capped to the field in
  // `sizeConstraints`, without which no shift could satisfy both edges.
  {
    name: 'fieldBoundary',
    enabled: !!boundaryElement,
    phase: 'main',
    requires: ['preventOverflow'],
    fn: ({ state }) => {
      const offsets = state.modifiersData.popperOffsets;
      if (!offsets || !boundaryElement) {
        return;
      }

      const field = boundaryElement.getBoundingClientRect();
      if (!field.width) {
        return;
      }

      // `strategy: 'fixed'` puts popperOffsets in viewport coordinates, same as getBoundingClientRect
      offsets.x = clampToFieldBounds(offsets.x, state.rects.popper.width, field, window.innerWidth);
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

      // A popup wider than its field can never fit inside it, so the `fieldBoundary` shift above
      // would have nothing to work with. Cap every width to the field when it is known.
      const fieldWidth = boundaryElement?.getBoundingClientRect().width;
      const capToField = (px: number): number => (fieldWidth ? Math.min(px, fieldWidth) : px);

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
        const popperLeft = state.modifiersData.popperOffsets?.x ?? state.rects.reference.x;
        const availableWidth = viewportWidth - popperLeft - rightEdgePadding;
        finalWidth = Math.min(finalWidth, availableWidth);

        state.styles.popper.minWidth = `${capToField(Math.min(effectiveMinWidth, availableWidth))}px`;
        state.styles.popper.width = `${capToField(finalWidth)}px`;
        state.styles.popper.maxWidth = fieldWidth ? `${fieldWidth}px` : `calc(60vw - ${rightEdgePadding * 2}px)`;
      } else if (variant === 'script-editor') {
        if (isMobile) {
          const popperLeft = state.modifiersData.popperOffsets?.x ?? state.rects.reference.x;
          const availableWidth = viewportWidth - popperLeft - rightEdgePadding;
          const constrainedWidth = capToField(Math.max(availableWidth, 280));

          state.styles.popper.minWidth = `${constrainedWidth}px`;
          state.styles.popper.width = `${constrainedWidth}px`;
          state.styles.popper.maxWidth = `${constrainedWidth}px`;

          if (state.styles.popper.right !== undefined) {
            delete state.styles.popper.right;
          }
        } else {
          state.styles.popper.minWidth = `${capToField(600)}px`;
          state.styles.popper.maxWidth = fieldWidth ? `${fieldWidth}px` : `calc(60vw - ${rightEdgePadding * 2}px)`;
        }
      } else if (variant === 'lexical') {
        // Cap to the window as well as to the field. A rich-text editor is routinely as wide as its
        // container, so on a narrow screen the field cap alone gives back the full viewport width —
        // and `fieldBoundary` has already reserved padding on the left, so the popup ends up
        // hanging past the right edge by exactly that much. The text-field branch above does the
        // same thing; only this variant was missing it.
        const popperLeft = state.modifiersData.popperOffsets?.x ?? state.rects.reference.x;
        const bounds = { fieldWidth, viewportWidth, popperLeft, edgePadding: rightEdgePadding };

        state.styles.popper.minWidth = `${clampPopupWidth(450, bounds)}px`;
        state.styles.popper.maxWidth = `${clampPopupWidth(600, bounds)}px`;
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
  /** Field the popup belongs to: it may not leave this element's horizontal bounds (see fieldBoundary) */
  boundaryElement?: HTMLElement | null;
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
  boundaryElement,
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
    () => createModifiers(variant, minWidth, maxWidth, contentMetrics, isPlacementLocked, boundaryElement),
    [variant, minWidth, maxWidth, contentMetrics, isPlacementLocked, boundaryElement]
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
