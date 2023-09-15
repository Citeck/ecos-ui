import React from 'react';
import classNames from 'classnames';
import { $createCodeNode } from '@lexical/code';
import { $setBlocksType } from '@lexical/selection';
import { $createParagraphNode, $getSelection, $isRangeSelection, DEPRECATED_$isGridSelection } from 'lexical';

import { IcoBtn } from '../../../../../common/btns';
import { t } from '../../../../../../helpers/util';

const CodeFormatButton = ({ editor, isCodeBlock }) => {
  const formatCode = () => {
    editor.update(() => {
      let selection = $getSelection();
      if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
        if (selection.isCollapsed()) {
          $setBlocksType(selection, () => (isCodeBlock ? $createParagraphNode() : $createCodeNode()));
        } else {
          const textContent = selection.getTextContent();
          const node = isCodeBlock ? $createParagraphNode() : $createCodeNode();
          selection.insertNodes([node]);
          selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertRawText(textContent);
          }
        }
      }
    });
  };

  return (
    <IcoBtn
      title={t('editor.code-format')}
      icon="fa fa-code"
      className={classNames('ecos-rt-editor-toolbar__button', {
        'ecos-rt-editor-toolbar__button_active': isCodeBlock
      })}
      onClick={formatCode}
    />
  );
};

export default CodeFormatButton;
