import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { COMMAND_PRIORITY_CRITICAL, COMMAND_PRIORITY_EDITOR } from 'lexical';

import TableDialogManager from './TableDialogManager';
import { CREATE_TABLE, OPEN_TABLE_DIALOG } from './constants';

const TablePlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [, setActiveEditor] = useState(editor);

  const tableManager = new TableDialogManager();

  useEffect(
    () => {
      return mergeRegister(
        editor.registerCommand(
          OPEN_TABLE_DIALOG,
          (_payload, newEditor) => {
            setActiveEditor(newEditor);

            tableManager.open(newEditor);
            return false;
          },
          COMMAND_PRIORITY_EDITOR
        ),
        editor.registerCommand(
          CREATE_TABLE,
          payload => {
            console.log('payload ', payload);

            return false;
          },
          COMMAND_PRIORITY_CRITICAL
        )
      );
    },
    [editor]
  );

  return null;
};

export default TablePlugin;
