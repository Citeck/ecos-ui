/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import * as React from 'react';
import { ReactPortal } from 'react';
import { createPortal } from 'react-dom';

import TableCellActionMenuContainer from './TableCellActionMenuContainer';

export default function TableActionMenuPlugin({
  anchorElem = document.body,
  cellMerge = false
}: {
  anchorElem?: HTMLElement;
  cellMerge?: boolean;
}): null | ReactPortal {
  const isEditable = useLexicalEditable();
  return createPortal(isEditable ? <TableCellActionMenuContainer anchorElem={anchorElem} cellMerge={cellMerge} /> : null, anchorElem);
}
