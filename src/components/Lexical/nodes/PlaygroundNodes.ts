import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HashtagNode } from '@lexical/hashtag';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { OverflowNode } from '@lexical/overflow';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';

import { CollapsibleContainerNode } from '../plugins/CollapsiblePlugin/CollapsibleContainerNode';
import { CollapsibleContentNode } from '../plugins/CollapsiblePlugin/CollapsibleContentNode';
import { CollapsibleTitleNode } from '../plugins/CollapsiblePlugin/CollapsibleTitleNode';

import { AutocompleteNode } from './AutocompleteNode';
import { EquationNode } from './EquationNode';
import { ExcalidrawNode } from './ExcalidrawNode';
import { FileNode } from './FileNode';
import { ImageNode } from './ImageNode';
import { KeywordNode } from './KeywordNode';
import { LayoutContainerNode } from './LayoutContainerNode';
import { LayoutItemNode } from './LayoutItemNode';
import { MentionNode } from './MentionNode';
import { PageBreakNode } from './PageBreakNode';
import { PollNode } from './PollNode';
import { SpecialTextNode } from './SpecialTextNode';

import type { Klass, LexicalNode } from 'lexical';

const PlaygroundNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  FileNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HashtagNode,
  CodeHighlightNode,
  AutoLinkNode,
  LinkNode,
  OverflowNode,
  PollNode,
  ImageNode,
  MentionNode,
  ExcalidrawNode,
  EquationNode,
  AutocompleteNode,
  KeywordNode,
  HorizontalRuleNode,
  MarkNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
  PageBreakNode,
  LayoutContainerNode,
  LayoutItemNode,
  SpecialTextNode
];

export default PlaygroundNodes;
