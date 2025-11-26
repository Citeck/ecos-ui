/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LexicalEditor } from 'lexical';
import * as React from 'react';
import { JSX, useState } from 'react';

import { INSERT_LAYOUT_COMMAND } from './LayoutPlugin';

import Button from '@/components/common/btns/Btn';
import { Dropdown } from '@/components/common/form';
import { t } from '@/helpers/export/util';

interface LayoutItem {
  label: string;
  value: string;
}

const LAYOUTS: LayoutItem[] = [
  { label: 'lexical.plugins.layout.two-col', value: '1fr 1fr' },
  { label: 'lexical.plugins.layout.two-col-alternative', value: '1fr 3fr' },
  { label: 'lexical.plugins.layout.three-col', value: '1fr 1fr 1fr' },
  { label: 'lexical.plugins.layout.three-col-alternative', value: '1fr 2fr 1fr' },
  { label: 'lexical.plugins.layout.fore-col', value: '1fr 1fr 1fr 1fr' }
];

export default function InsertLayoutDialog({ activeEditor, onClose }: { activeEditor: LexicalEditor; onClose: () => void }): JSX.Element {
  const [selectedValue, setSelectedValue] = useState<string>(LAYOUTS[0].value);

  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_LAYOUT_COMMAND, selectedValue);
    onClose();
  };

  return (
    <div className="citeck-lexical-editor__dropdown-wrapper">
      <Dropdown
        source={LAYOUTS}
        valueField="value"
        titleField="label"
        value={selectedValue}
        onChange={(selected: LayoutItem) => setSelectedValue(selected.value)}
      />
      <Button onClick={onClick}>{t('insert')}</Button>
    </div>
  );
}
