import classNames from 'classnames';
import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import ReactDOM from 'react-dom';

import { t } from '../../../../helpers/export/util';

import './ColorPicker.scss';

const PRESET_COLORS = [
  'var(--light-primary-color)',
  '#F3DBCD',
  '#E4D7EA',
  '#6384AC',
  '#54919A',
  '#E8EDEF',
  '#D1E0CD',
  '#EEF0F8',
  'var(--primary-color)',
  '#D46E2D',
  '#895F9C',
  '#DEE8F7',
  '#FFFFFF',
  '#000000',
  '#444444',
  '#9B9B9B'
];

const Labels = {
  PLACEHOLDER: 'color-picker.placeholder'
};

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const isHexColor = (value: string): boolean => HEX_REGEX.test(value);

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  disabled?: boolean;
  presetColors?: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, disabled, presetColors }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localColor, setLocalColor] = useState(value || '');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const swatchRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const colors = presetColors || PRESET_COLORS;

  useEffect(() => {
    setLocalColor(value || '');
  }, [value]);

  const updatePosition = useCallback(() => {
    if (swatchRef.current) {
      const rect = swatchRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePosition();

    const listener = (event: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        swatchRef.current &&
        !swatchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', listener);

    return () => {
      document.removeEventListener('pointerdown', listener);
    };
  }, [isOpen, updatePosition]);

  const emitChange = useCallback(
    (color: string) => {
      onChange?.(color);
    },
    [onChange]
  );

  const handlePickerChange = useCallback(
    (color: string) => {
      setLocalColor(color);
      emitChange(color);
    },
    [emitChange]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalColor(val);
      emitChange(val);
    },
    [emitChange]
  );

  const handlePresetClick = useCallback(
    (color: string) => {
      setLocalColor(color);
      emitChange(color);
      setIsOpen(false);
    },
    [emitChange]
  );

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  }, [disabled]);

  const hexValue = isHexColor(localColor) ? localColor : '#000000';

  return (
    <div className="ecos-color-picker">
      <div
        ref={swatchRef}
        className={classNames('ecos-color-picker__swatch', {
          'ecos-color-picker__swatch_disabled': disabled
        })}
        onClick={handleToggle}
      >
        <div className="ecos-color-picker__color" style={{ backgroundColor: localColor || 'transparent' }} />
        <span className="ecos-color-picker__value">{localColor || t(Labels.PLACEHOLDER)}</span>
        <span className="ecos-color-picker__icon">
          <i className="fa fa-eyedropper" />
        </span>
      </div>

      {isOpen &&
        ReactDOM.createPortal(
          <div className="ecos-color-picker__popover" ref={popoverRef} style={{ top: position.top, left: position.left }}>
            <HexColorPicker color={hexValue} onChange={handlePickerChange} />

            <input
              className="ecos-color-picker__input"
              value={localColor}
              onChange={handleInputChange}
              placeholder="#hex, rgb(0, 0, 0), var(--primary)"
            />

            <div className="ecos-color-picker__presets">
              {colors.map(color => (
                <button
                  key={color}
                  className={classNames('ecos-color-picker__preset', {
                    'ecos-color-picker__preset_active': localColor?.toUpperCase() === color.toUpperCase()
                  })}
                  style={{ backgroundColor: color }}
                  onClick={() => handlePresetClick(color)}
                  type="button"
                />
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ColorPicker;
