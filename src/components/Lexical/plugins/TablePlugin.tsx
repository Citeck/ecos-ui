/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_TABLE_COMMAND, TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { EditorThemeClasses, Klass, LexicalEditor, LexicalNode } from 'lexical';
import React, { JSX, createContext, useContext, useEffect, useMemo, useState } from 'react';

import invariant from '../shared/invariant';
import { DialogActions } from '../ui/Dialog';
import TextInput from '../ui/TextInput';

import Button from '@/components/common/btns/Btn';
import { t } from '@/helpers/export/util';

export type InsertTableCommandPayload = Readonly<{
  columns: string;
  rows: string;
  includeHeaders?: boolean;
}>;

export type CellContextShape = {
  cellEditorConfig: null | CellEditorConfig;
  cellEditorPlugins: null | React.JSX.Element | Array<React.JSX.Element>;
  set: (cellEditorConfig: null | CellEditorConfig, cellEditorPlugins: null | React.JSX.Element | Array<React.JSX.Element>) => void;
};

export type CellEditorConfig = Readonly<{
  namespace: string;
  nodes?: ReadonlyArray<Klass<LexicalNode>>;
  onError: (error: Error, editor: LexicalEditor) => void;
  readOnly?: boolean;
  theme?: EditorThemeClasses;
}>;

export const CellContext = createContext<CellContextShape>({
  cellEditorConfig: null,
  cellEditorPlugins: null,
  set: () => {
    // Empty
  }
});

export function TableContext({ children }: { children: React.JSX.Element }) {
  const [contextValue, setContextValue] = useState<{
    cellEditorConfig: null | CellEditorConfig;
    cellEditorPlugins: null | React.JSX.Element | Array<React.JSX.Element>;
  }>({
    cellEditorConfig: null,
    cellEditorPlugins: null
  });
  return (
    <CellContext.Provider
      value={useMemo(
        () => ({
          cellEditorConfig: contextValue.cellEditorConfig,
          cellEditorPlugins: contextValue.cellEditorPlugins,
          set: (cellEditorConfig, cellEditorPlugins) => {
            setContextValue({ cellEditorConfig, cellEditorPlugins });
          }
        }),
        [contextValue.cellEditorConfig, contextValue.cellEditorPlugins]
      )}
    >
      {children}
    </CellContext.Provider>
  );
}

export function InsertTableDialog({ activeEditor, onClose }: { activeEditor: LexicalEditor; onClose: () => void }): JSX.Element {
  const [rows, setRows] = useState('5');
  const [columns, setColumns] = useState('5');
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    const row = Number(rows);
    const column = Number(columns);
    if (row && row > 0 && row <= 500 && column && column > 0 && column <= 50) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [rows, columns]);

  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns,
      rows
    });

    onClose();
  };

  return (
    <>
      <TextInput
        placeholder={'# of rows (1-500)'}
        label={t('lexical.plugins.table.rows')}
        onChange={setRows}
        value={rows}
        data-test-id="table-modal-rows"
        type="number"
      />
      <TextInput
        placeholder={'# of columns (1-50)'}
        label={t('lexical.plugins.table.columns')}
        onChange={setColumns}
        value={columns}
        data-test-id="table-modal-columns"
        type="number"
      />
      <DialogActions data-test-id="table-model-confirm-insert">
        <Button disabled={isDisabled} onClick={onClick}>
          {t('confirm')}
        </Button>
      </DialogActions>
    </>
  );
}

export function TablePlugin({
  cellEditorConfig,
  children
}: {
  cellEditorConfig: CellEditorConfig;
  children: JSX.Element | Array<JSX.Element>;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const cellContext = useContext(CellContext);
  useEffect(() => {
    if (!editor.hasNodes([TableNode, TableRowNode, TableCellNode])) {
      invariant(false, 'TablePlugin: TableNode, TableRowNode, or TableCellNode is not registered on editor');
    }
  }, [editor]);
  useEffect(() => {
    cellContext.set(cellEditorConfig, children);
  }, [cellContext, cellEditorConfig, children]);
  return null;
}
