import { $generateHtmlFromNodes } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useDebounce } from 'use-debounce';

import useLayoutEffect from '../shared/useLayoutEffect';

import { updateEditorContent } from '@/helpers/lexical';

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
        updateEditorContent(editor, normHtml);
      }
    });
  }, [normHtml]); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useSyncWithInputHtml;
