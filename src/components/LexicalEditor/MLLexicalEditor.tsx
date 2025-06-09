import { $generateHtmlFromNodes } from '@lexical/html';
import classNames from 'classnames';
import isFunction from 'lodash/isFunction';
import React, { useState } from 'react';

import Tooltip from '../common/Tooltip';

import LexicalEditor from './LexicalEditor';

import { LexicalEditorProps } from '@/components/Lexical';
import { allowedLanguages } from '@/constants/lang';
import { getCurrentLocale } from '@/helpers/export/util';
import { prepareTooltipId } from '@/helpers/util';
import { AllowedLanguageType } from '@/types/langs';

import './index.scss';

interface IMLValue {
  [key: string]: LexicalEditorProps['htmlString'];
}

interface MLLexicalEditorProps extends Omit<LexicalEditorProps, 'htmlString' | 'onChange' | 'editorChildren'> {
  lang?: string;
  imgClassName?: string;
  onChange?: (value: IMLValue) => void;
  value: IMLValue;
  languages: AllowedLanguageType[];
}

export default function MLLexicalEditor({
  lang: pLang = getCurrentLocale(),
  value,
  onChange,
  languages,
  imgClassName,
  ...lexicalProps
}: MLLexicalEditorProps) {
  const [selectedValue, setSelectedValue] = useState<IMLValue>(value);
  const [selectedLang, setSelectedLang] = useState<string>(pLang);
  const [_keyTooltip] = useState(prepareTooltipId());

  const handleChange: LexicalEditorProps['onChange'] = (_, editor) => {
    editor.update(() => {
      const html = $generateHtmlFromNodes(editor, null);

      const newState: IMLValue = {
        ...selectedValue,
        [selectedLang]: html
      };

      setSelectedValue(newState);
      isFunction(onChange) && onChange(newState);
    });
  };

  const renderTooltip = () => {
    return languages
      .filter(lang => lang.id !== selectedLang)
      .map(lang => (
        <div key={lang.id} className="ecos-ml-text__tooltip-lang" onClick={() => handleClickLang(lang.id)}>
          <span className="ecos-ml-text__tooltip-lang-label">{lang.label}</span>
          <img className="ecos-ml-text__tooltip-lang-image" src={lang.img} alt={lang.label} />
        </div>
      ));
  };

  const handleClickLang = (selectedLang: string) => {
    setSelectedLang(selectedLang);
  };

  const renderLang = () => {
    const lang = languages.find(item => item.id === selectedLang);
    let extraImageProps = null;

    if (!lang) {
      return null;
    }

    if (languages.length === 2) {
      const unselected = languages.find(item => item.id !== selectedLang);

      if (unselected) {
        extraImageProps = {
          onClick: () => handleClickLang(unselected.id)
        };
      }
    }

    return (
      <Tooltip
        uncontrolled
        target={_keyTooltip}
        className="ecos-ml-text__tooltip"
        arrowClassName="ecos-ml-text__tooltip-arrow"
        delay={{ show: 0, hide: 450 }}
        contentComponent={renderTooltip()}
      >
        <img
          id={_keyTooltip}
          className={classNames('citeck-ml-lexical-editor__ml-btn ecos-ml-text__image_visible', imgClassName)}
          src={lang.img}
          alt={lang.label}
          {...extraImageProps}
        />
      </Tooltip>
    );
  };

  return (
    <div className="citeck-ml-lexical-editor">
      <LexicalEditor
        {...lexicalProps}
        withoutTimeout
        htmlString={value[selectedLang]}
        onChange={handleChange}
        editorChildren={renderLang()}
      />
    </div>
  );
}

MLLexicalEditor.defaultProps = {
  languages: allowedLanguages
};
