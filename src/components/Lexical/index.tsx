/* eslint-disable header/header */
import './index.scss';

import Editor from './Editor';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import TestRecorderPlugin from './plugins/TestRecorderPlugin';
import TypingPerfPlugin from './plugins/TypingPerfPlugin';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';

export { SharedHistoryContext } from './context/SharedHistoryContext';
export * from './Editor';

export { Editor, PlaygroundEditorTheme, PlaygroundNodes, TestRecorderPlugin, TypingPerfPlugin };
