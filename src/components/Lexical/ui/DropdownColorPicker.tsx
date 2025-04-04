/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import { useState } from 'react';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';

import ColorPicker from './ColorPicker';

type Props = {
  disabled?: boolean;
  buttonAriaLabel?: string;
  buttonClassName: string;
  buttonIconClassName?: string;
  buttonLabel?: string;
  title?: string;
  stopCloseOnClickSelf?: boolean;
  color: string;
  onChange?: (color: string, skipHistoryStack: boolean) => void;
};

export default function DropdownColorPicker({ disabled = false, color, onChange, buttonIconClassName }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggle = () => setDropdownOpen(!dropdownOpen);

  return (
    <Dropdown isOpen={dropdownOpen} toggle={toggle} disabled={disabled}>
      <DropdownToggle
        onClick={toggle}
        data-toggle="dropdown"
        aria-expanded={dropdownOpen}
        className="citeck-lexical-editor__dropdown-toggle toolbar-item color-picker"
        tag="span"
      >
        <span className={`icon ${buttonIconClassName}`} />
        <i className="chevron-down" />
      </DropdownToggle>
      <div className="citeck-lexical-editor__dropdown">
        <DropdownMenu className="ecos-dropdown__menu dropdown">
          <ColorPicker color={color} onChange={onChange} />
        </DropdownMenu>
      </div>
    </Dropdown>
  );
}
