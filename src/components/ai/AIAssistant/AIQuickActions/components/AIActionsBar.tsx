/**
 * AIActionsBar Component
 * Universal panel with quick actions and prompt input
 */

import React, { useState, useRef, useEffect, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import classNames from 'classnames';
import { t } from '@/helpers/export/util';
import { Icon } from '@/components/common';
import { QuickAction, ActionIcon } from '../config/fieldActionConfigs';

/**
 * Sparkle Icon for the input
 */
const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 50 50"
    fill="currentColor"
  >
    <path d="M49.04,24.001l-1.082-0.043h-0.001C36.134,23.492,26.508,13.866,26.042,2.043L25.999,0.96C25.978,0.424,25.537,0,25,0s-0.978,0.424-0.999,0.96l-0.043,1.083C23.492,13.866,13.866,23.492,2.042,23.958L0.96,24.001C0.424,24.022,0,24.463,0,25c0,0.537,0.424,0.978,0.961,0.999l1.082,0.042c11.823,0.467,21.449,10.093,21.915,21.916l0.043,1.083C24.022,49.576,24.463,50,25,50s0.978-0.424,0.999-0.96l0.043-1.083c0.466-11.823,10.092-21.449,21.915-21.916l1.082-0.042C49.576,25.978,50,25.537,50,25C50,24.463,49.576,24.022,49.04,24.001z" />
  </svg>
);

/**
 * Quick Action Icon - renders FA or inline SVG
 */
const ActionIconComponent: React.FC<{ icon?: ActionIcon }> = ({ icon }) => {
  if (!icon) return null;

  if (icon.fa) {
    return <Icon className={`fa ${icon.fa}`} />;
  }

  if (icon.svg) {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={icon.svg} />
      </svg>
    );
  }

  return null;
};

export interface AIActionsBarProps {
  isVisible?: boolean;
  quickActions?: QuickAction[];
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onQuickAction?: (actionId: string) => void;
  onSubmit?: (prompt: string) => void;
  onClose?: () => void;
  className?: string;
  variant?: 'default' | 'code-editor';
}

const AIActionsBar: React.FC<AIActionsBarProps> = ({
  isVisible = false,
  quickActions = [],
  placeholder = '',
  isLoading = false,
  disabled = false,
  onQuickAction,
  onSubmit,
  onClose,
  className,
  variant = 'default'
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when bar becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current && !disabled) {
      // Small delay to allow animation to start
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isVisible, disabled]);

  // Reset input when bar is closed
  useEffect(() => {
    if (!isVisible) {
      setInputValue('');
    }
  }, [isVisible]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 150;
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [inputValue]);

  const handleSubmit = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !isLoading && !disabled) {
      onSubmit?.(trimmedValue);
    }
  }, [inputValue, isLoading, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [onClose, handleSubmit]);

  const handleQuickActionClick = useCallback((actionId: string) => {
    if (!isLoading && !disabled) {
      onQuickAction?.(actionId);
    }
  }, [isLoading, disabled, onQuickAction]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onClose?.();
  }, [onClose]);

  const defaultPlaceholder = t('ai-actions.input.placeholder', 'Describe what you need...');
  const hasQuickActions = quickActions.length > 0;
  const canSubmit = inputValue.trim() && !isLoading && !disabled;

  return (
    <div
      className={classNames(
        'ai-actions-bar',
        {
          'ai-actions-bar--visible': isVisible,
          'ai-actions-bar--loading': isLoading,
          'ai-actions-bar--with-actions': hasQuickActions,
          [`ai-actions-bar--${variant}`]: variant !== 'default'
        },
        className
      )}
    >
      {/* Quick Actions */}
      {hasQuickActions && (
        <div className="ai-actions-bar__quick">
          {quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="ai-quick-action"
              onClick={() => handleQuickActionClick(action.id)}
              disabled={isLoading || disabled}
              title={typeof action.getLabel === 'function' ? action.getLabel() : action.label}
            >
              <ActionIconComponent icon={action.icon} />
              <span>{typeof action.getLabel === 'function' ? action.getLabel() : action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Row */}
      <div className="ai-actions-bar__input-row">
        <div className="ai-actions-bar__icon">
          {isLoading ? (
            <Icon className="fa fa-spinner fa-spin" />
          ) : (
            <SparkleIcon />
          )}
        </div>

        <textarea
          ref={inputRef}
          className="ai-actions-bar__input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || defaultPlaceholder}
          disabled={isLoading || disabled}
          autoComplete="off"
          rows={1}
        />

        <div className="ai-actions-bar__actions">
          {canSubmit && (
            <button
              type="button"
              className="ai-actions-bar__submit"
              onClick={handleSubmit}
              disabled={!canSubmit}
              title={t('ai-actions.input.submit', 'Submit (Enter)')}
            >
              <Icon className="fa fa-arrow-right" />
            </button>
          )}

          <button
            type="button"
            className="ai-actions-bar__close"
            onClick={handleClose}
            disabled={isLoading}
            title={t('ai-actions.input.close', 'Close (Escape)')}
          >
            <Icon className="fa fa-times" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIActionsBar;
