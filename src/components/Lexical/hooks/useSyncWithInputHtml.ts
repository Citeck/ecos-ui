/* eslint-disable header/header */
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { useDebounce } from 'use-debounce';

import useLayoutEffect from '../shared/useLayoutEffect';

type Options = {
  timeoutMs?: number;
};

const useSyncWithInputHtml = (html?: string | null, { timeoutMs = 800 }: Options = {}) => {
  const [editor] = useLexicalComposerContext();
  const [debHtml] = useDebounce(html, timeoutMs);
  const normHtml = editor.getEditorState().isEmpty() ? html : debHtml;

  useLayoutEffect(() => {
    editor.update(() => {
      if ($generateHtmlFromNodes(editor, null) !== normHtml) {
        $getRoot().clear();
        const phNode = $createParagraphNode();
        phNode.append($createTextNode(''));
        $getRoot().append(phNode);

        /** Why is this? This select makes auto-transfer when you start typing text **/
        // $getRoot().select();

        const parser = new DOMParser();
        const dom = parser.parseFromString(normHtml ?? '', 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $getRoot().select();
          selection.insertNodes(nodes);
        }
      }
    });
  }, [normHtml]); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useSyncWithInputHtml;
