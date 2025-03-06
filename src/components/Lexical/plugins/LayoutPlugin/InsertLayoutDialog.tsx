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

import Button from '../../ui/Button';
import DropDown, { DropDownItem } from '../../ui/DropDown';

import { INSERT_LAYOUT_COMMAND } from './LayoutPlugin';

import { t } from '@/helpers/export/util';

const LAYOUTS = [
  { label: 'lexical.plugins.layout.two-col', value: '1fr 1fr' },
  { label: 'lexical.plugins.layout.two-col-alternative', value: '1fr 3fr' },
  { label: 'lexical.plugins.layout.three-col', value: '1fr 1fr 1fr' },
  { label: 'lexical.plugins.layout.three-col-alternative', value: '1fr 2fr 1fr' },
  { label: 'lexical.plugins.layout.fore-col', value: '1fr 1fr 1fr 1fr' },
];

export default function InsertLayoutDialog({ activeEditor, onClose }: { activeEditor: LexicalEditor; onClose: () => void }): JSX.Element {
  const [layout, setLayout] = useState(LAYOUTS[0].value);
  const buttonLabel = LAYOUTS.find((item) => item.value === layout)?.label || '';

  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_LAYOUT_COMMAND, layout);
    onClose();
  };

  return (
    <>
      <DropDown buttonClassName="toolbar-item dialog-dropdown" buttonLabel={t(buttonLabel)}>
        {LAYOUTS.map(({ label, value }) => (
          <DropDownItem key={value} className="item" onClick={() => setLayout(value)}>
            <span className="text">{t(label)}</span>
          </DropDownItem>
        ))}
      </DropDown>
      <Button onClick={onClick}>{t('insert')}</Button>
    </>
  );
}
