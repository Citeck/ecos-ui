/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import './ContentEditable.css';

import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import * as React from 'react';
import { JSX } from 'react';

type Props = {
  className?: string;
  autoFocus?: boolean;
  placeholderClassName?: string;
  placeholder: string;
};

export default function LexicalContentEditable({ className, placeholder, placeholderClassName, autoFocus = false }: Props): JSX.Element {
  return (
    <ContentEditable
      className={className ?? 'ContentEditable__root'}
      aria-placeholder={placeholder}
      placeholder={<div className={placeholderClassName ?? 'ContentEditable__placeholder'}>{placeholder}</div>}
      {...(!autoFocus && {
        onFocus: e => {
          (e.currentTarget as HTMLElement).blur();
        }
      })}
    />
  );
}
