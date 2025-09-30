import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  MenuTextMatch,
  useBasicTypeaheadTriggerMatch
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { Avatar } from '../../../common';
import { $createMentionNode } from '../../nodes/MentionNode';

import { OrgStructApi } from '@/api/orgStruct.js';
import { SourcesId } from '@/constants';

const PUNCTUATION = '\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%\'"~=<>_:;';
const NAME = '\\b[A-Z][^\\s' + PUNCTUATION + ']';

const DocumentMentionsRegex = { NAME, PUNCTUATION };

const PUNC = DocumentMentionsRegex.PUNCTUATION;

const TRIGGERS = ['@'].join('');

const VALID_CHARS = '[^' + TRIGGERS + PUNC + '\\s]';

// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
const VALID_JOINS =
  '(?:' +
  '\\.[ |$]|' + // E.g. "r. " in "Mr. Smith"
  ' |' + // E.g. " " in "Josh Duck"
  '[' +
  PUNC +
  ']|' + // E.g. "-' in "Salier-Hellendag"
  ')';

const LENGTH_LIMIT = 75;

const AtSignMentionsRegex = new RegExp(
  '(^|\\s|\\()(' + '[' + TRIGGERS + ']' + '((?:' + VALID_CHARS + VALID_JOINS + '){0,' + LENGTH_LIMIT + '})' + ')$'
);

const ALIAS_LENGTH_LIMIT = 50;

// Regex used to match alias.
const AtSignMentionsRegexAliasRegex = new RegExp(
  '(^|\\s|\\()(' + '[' + TRIGGERS + ']' + '((?:' + VALID_CHARS + '){0,' + ALIAS_LENGTH_LIMIT + '})' + ')$'
);

const SUGGESTION_LIST_LENGTH_LIMIT = 10;

const mentionsCache = new Map();

interface Attributes<T = unknown> {
  [key: string]: T;
}

type ItemOrgStruct = {
  id: string;
  label: string;
  extraLabel: string;
  isPersonDisabled: boolean;
  attributes: Attributes;
};

const lookupService = {
  async search(string: string, callback: (items: ItemOrgStruct[]) => void) {
    if (string.length < 2) {
      return;
    }

    const { items = [] } = await OrgStructApi.getUserList(string);

    if (Array.isArray(items)) {
      callback(items || []);
    }
  }
};

function useMentionLookupService(mentionString: string | null) {
  const [results, setResults] = useState<ItemOrgStruct[]>([]);

  useEffect(() => {
    const cachedResults = mentionsCache.get(mentionString);

    if (mentionString == null) {
      setResults([]);
      return;
    }

    if (cachedResults === null) {
      return;
    } else if (cachedResults !== undefined) {
      setResults(cachedResults);
      return;
    }

    mentionsCache.set(mentionString, null);

    lookupService.search(mentionString, newResults => {
      mentionsCache.set(mentionString, newResults);
      setResults(newResults);
    });
  }, [mentionString]);

  return results;
}

function checkForAtSignMentions(text: string, minMatchLength: number) {
  let match = AtSignMentionsRegex.exec(text);

  if (match === null) {
    match = AtSignMentionsRegexAliasRegex.exec(text);
  }

  if (match !== null) {
    const maybeLeadingWhitespace = match[1];
    const matchingString = match[3];

    if (matchingString.length >= minMatchLength) {
      return {
        leadOffset: match.index + maybeLeadingWhitespace.length,
        matchingString,
        replaceableString: match[2]
      };
    }
  }

  return null;
}

class MentionTypeaheadOption extends MenuOption {
  id: string;
  name: string;
  picture: ReactNode;

  constructor(authorityId: string, name: string, picture: ReactNode) {
    super(name);
    this.id = authorityId;
    this.name = name;
    this.picture = picture;
  }
}

function MentionsTypeaheadMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: MentionTypeaheadOption;
}) {
  let className = 'item';

  if (isSelected) {
    className += ' selected';
  }

  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={className}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      {option.picture}
      <span className="text">{option.name}</span>
    </li>
  );
}

function getPossibleQueryMatch(text: string): MenuTextMatch | null {
  return checkForAtSignMentions(text, 1);
}

export default function MentionsPlugin() {
  const [queryString, setQueryString] = useState<string | null>(null);

  const [editor] = useLexicalComposerContext();
  const results = useMentionLookupService(queryString);

  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0
  });

  const options = useMemo(
    () =>
      results
        .map(item => new MentionTypeaheadOption(item.id, item.label, <Avatar url={item?.attributes?.photo} noBorder />))
        .slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [results]
  );

  const onSelectOption = useCallback(
    ({ id: _id, name }: MentionTypeaheadOption, nodeToReplace: any, closeMenu: () => void) => {
      const id = _id && _id.includes(SourcesId.PERSON) ? _id.split('@')[1] : _id;

      editor.update(() => {
        const mentionNode = $createMentionNode(name, id);

        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }

        mentionNode.select();

        closeMenu();
      });
    },
    [editor]
  );

  const checkForMentionMatch = useCallback(
    (text: string) => {
      const slashMatch = checkForSlashTriggerMatch(text, editor);

      if (slashMatch !== null) {
        return null;
      }

      return getPossibleQueryMatch(text);
    },
    [checkForSlashTriggerMatch, editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForMentionMatch}
      options={options}
      onOpen={() => null}
      onClose={() => null}
      anchorClassName=""
      // @ts-ignore
      menuRenderFn={(anchorElementRef: React.RefObject<HTMLElement>, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) =>
        anchorElementRef.current && results.length
          ? createPortal(
              <div className="typeahead-popover mentions-menu">
                <ul>
                  {options.map((option, i) => (
                    <MentionsTypeaheadMenuItem
                      index={i}
                      isSelected={selectedIndex === i}
                      onClick={() => {
                        setHighlightedIndex(i);
                        selectOptionAndCleanUp(option);
                      }}
                      onMouseEnter={() => {
                        setHighlightedIndex(i);
                      }}
                      key={option.key}
                      option={option}
                    />
                  ))}
                </ul>
              </div>,
              anchorElementRef.current
            )
          : null
      }
    />
  );
}
