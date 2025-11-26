import { $generateHtmlFromNodes } from '@lexical/html';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import React, { Component } from 'react';

import Tooltip from '../common/Tooltip';

import LexicalEditor from './LexicalEditor';

import { LexicalEditorProps } from '@/components/Lexical';
import { allowedLanguages } from '@/constants/lang';
import { prepareTooltipId } from '@/helpers/util';
import { AllowedLanguageType } from '@/types/langs';

import './index.scss';

interface IMLValue {
  [key: string]: LexicalEditorProps['htmlString'];
}

interface MLLexicalEditorProps extends Omit<LexicalEditorProps, 'htmlString' | 'onChange' | 'editorChildren'> {
  lang: string;
  imgClassName?: string;
  onChange?: (value: IMLValue) => void;
  value: IMLValue;
  languages: AllowedLanguageType[];
}

interface MLLexicalEditorState {
  selectedValue: MLLexicalEditorProps['value'];
  selectedLang: MLLexicalEditorProps['lang'];
}

export default class MLLexicalEditor extends Component<MLLexicalEditorProps, MLLexicalEditorState> {
  static defaultProps: { languages: AllowedLanguageType[] };

  _keyTooltip?: string;

  constructor(props: Readonly<MLLexicalEditorProps>) {
    super(props);

    this.state = {
      selectedValue: props.value,
      selectedLang: props.lang
    };
  }

  componentDidMount() {
    this._keyTooltip = prepareTooltipId();
  }

  handleChange: LexicalEditorProps['onChange'] = (_, editor) => {
    const { selectedValue, selectedLang } = this.state;
    const { onChange } = this.props;

    editor.update(() => {
      const html = $generateHtmlFromNodes(editor, null);

      if (!isNil(html)) {
        const newState: IMLValue = {
          ...selectedValue,
          [selectedLang]: html
        };

        if (!isEqual(newState, selectedValue)) {
          this.setState({ selectedValue: newState });
          isFunction(onChange) && onChange(newState);
        }
      }
    });
  };

  handleClickLang = (selectedLang: string) => {
    this.setState({ selectedLang });
  };

  renderTooltip = () => {
    return this.props.languages
      .filter(lang => lang.id !== this.state.selectedLang)
      .map(lang => (
        <div key={lang.id} className="ecos-ml-text__tooltip-lang" onClick={() => this.handleClickLang(lang.id)}>
          <span className="ecos-ml-text__tooltip-lang-label">{lang.label}</span>
          <img className="ecos-ml-text__tooltip-lang-image" src={lang.img} alt={lang.label} />
        </div>
      ));
  };

  renderLang = () => {
    const { languages, imgClassName } = this.props;
    const { selectedLang } = this.state;

    const lang = languages.find(item => item.id === selectedLang);
    let extraImageProps = null;

    if (!lang) {
      return null;
    }

    if (languages.length === 2) {
      const unselected = languages.find(item => item.id !== selectedLang);

      if (unselected) {
        extraImageProps = {
          onClick: () => this.handleClickLang(unselected.id)
        };
      }
    }

    return (
      <Tooltip
        uncontrolled
        target={this._keyTooltip}
        className="ecos-ml-text__tooltip"
        arrowClassName="ecos-ml-text__tooltip-arrow"
        delay={{ show: 0, hide: 450 }}
        contentComponent={this.renderTooltip()}
      >
        <img
          id={this._keyTooltip}
          className={classNames('citeck-ml-lexical-editor__ml-btn ecos-ml-text__image_visible', imgClassName)}
          src={lang.img}
          alt={lang.label}
          {...extraImageProps}
        />
      </Tooltip>
    );
  };

  render() {
    const { value, ...props } = this.props;
    const { selectedLang } = this.state;

    return (
      <div className="citeck-ml-lexical-editor">
        <LexicalEditor {...props} withoutTimeout htmlString={value[selectedLang]} onChange={this.handleChange} />
        {this.renderLang()}
      </div>
    );
  }
}

MLLexicalEditor.defaultProps = {
  languages: allowedLanguages
};
