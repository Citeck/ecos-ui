import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import * as React from 'react';
import { CHECK_LIST, ELEMENT_TRANSFORMERS, TEXT_FORMAT_TRANSFORMERS, TEXT_MATCH_TRANSFORMERS, TRANSFORMERS } from '@lexical/markdown';

const transformers = [CHECK_LIST, ...ELEMENT_TRANSFORMERS, ...TEXT_FORMAT_TRANSFORMERS, ...TEXT_MATCH_TRANSFORMERS, ...TRANSFORMERS];

export default function MarkdownPlugin() {
  return <MarkdownShortcutPlugin transformers={transformers} />;
}
