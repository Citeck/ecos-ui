/**
 * AIFieldTrigger Component
 * Universal trigger button for AI quick actions
 * Adapts position based on field type (inline, corner, floating)
 * Supports ref forwarding for Popper.js positioning
 */

import React, { forwardRef, MouseEvent } from 'react';
import classNames from 'classnames';
import { t } from '@/helpers/export/util';
import { TRIGGER_POSITIONS, TriggerPosition } from '../config/fieldActionConfigs';

/**
 * Sparkle Icon SVG
 */
const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 50 50"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M49.04,24.001l-1.082-0.043h-0.001C36.134,23.492,26.508,13.866,26.042,2.043L25.999,0.96C25.978,0.424,25.537,0,25,0s-0.978,0.424-0.999,0.96l-0.043,1.083C23.492,13.866,13.866,23.492,2.042,23.958L0.96,24.001C0.424,24.022,0,24.463,0,25c0,0.537,0.424,0.978,0.961,0.999l1.082,0.042c11.823,0.467,21.449,10.093,21.915,21.916l0.043,1.083C24.022,49.576,24.463,50,25,50s0.978-0.424,0.999-0.96l0.043-1.083c0.466-11.823,10.092-21.449,21.915-21.916l1.082-0.042C49.576,25.978,50,25.537,50,25C50,24.463,49.576,24.022,49.04,24.001z" />
  </svg>
);

export interface AIFieldTriggerProps {
  position?: TriggerPosition;
  isActive?: boolean;
  isGenerating?: boolean;
  disabled?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  customIcon?: React.ReactNode;
  triggerClassName?: string;
  preventSelectionLoss?: boolean;
  className?: string;
}

const AIFieldTrigger = forwardRef<HTMLButtonElement, AIFieldTriggerProps>(({
  position = TRIGGER_POSITIONS.INLINE,
  isActive = false,
  isGenerating = false,
  disabled = false,
  onClick,
  customIcon,
  triggerClassName,
  preventSelectionLoss = false,
  className
}, ref) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  // Prevent selection loss when clicking the trigger (for floating toolbars)
  const handleMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
    if (preventSelectionLoss) {
      e.preventDefault();
    }
  };

  // If triggerClassName is provided, use it instead of default classes
  const buttonClassName = triggerClassName
    ? classNames(triggerClassName, className)
    : classNames(
        'ai-field-trigger',
        `ai-field-trigger--${position}`,
        {
          'ai-field-trigger--active': isActive,
          'ai-field-trigger--generating': isGenerating,
          'ai-field-trigger--disabled': disabled
        },
        className
      );

  return (
    <button
      ref={ref}
      type="button"
      className={buttonClassName}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      disabled={disabled || isGenerating}
      title={t('ai-actions.trigger.title', 'AI Assistant')}
      aria-label={t('ai-actions.trigger.aria-label', 'Open AI Assistant')}
    >
      {customIcon || <SparkleIcon className="ai-field-trigger__icon" />}
    </button>
  );
});

AIFieldTrigger.displayName = 'AIFieldTrigger';

export default AIFieldTrigger;
