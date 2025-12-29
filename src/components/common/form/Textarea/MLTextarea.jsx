import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import AceEditor from 'react-ace';

import BaseMLField from '../BaseMLField';

import Textarea from './Textarea';

import { getHtmlIdByUid } from '@/helpers/util';
import ESMRequire from '@/services/ESMRequire';

import './Textarea.scss';

class MlTextarea extends BaseMLField {
  static propTypes = {
    ...BaseMLField.propTypes,
    editor: PropTypes.bool,
    editorLang: PropTypes.string
  };

  static defaultProps = {
    ...super.defaultProps,
    className: 'textarea__ml',
    imgClassName: 'textarea__ml-image',
    inputClassName: 'textarea__ml-input'
  };

  #editorId = getHtmlIdByUid(undefined, 'ml-textarea');

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      isLoadedEditor: false,
      currentValue: this.value
    };

    if (props.editor) {
      this.loadEditor();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { value, editor } = this.props;

    super.componentDidUpdate(prevProps, prevState);

    if (editor && !prevProps.editor) {
      this.loadEditor();
    }

    if (
      editor &&
      Object.keys(prevProps.value).every(key => isEmpty(prevProps.value[key])) &&
      Object.keys(value).some(key => !isEmpty(value[key]))
    ) {
      this.setState({ currentValue: this.value });
    }
  }

  get ignoredProps() {
    return [...super.ignoredProps, 'editor', 'editorLang'];
  }

  loadEditor() {
    ESMRequire.require(
      [
        `/js/lib/ace/1.4.1/mode-${this.props.editorLang}.js`,
        '/js/lib/ace/1.4.1/ext-language_tools.js',
        '/js/lib/ace/1.4.1/ext-searchbox.js',
        `/js/lib/ace/1.4.1/snippets/${this.props.editorLang}.js`
      ],
      () => this.setState({ isLoadedEditor: true })
    );
  }

  handleChangeEditor = (value, event) => {
    this.setState({ currentValue: value });
    this.handleChangeText({ target: { value } });
  };

  handleClickLang(selectedLang) {
    const { value } = this.props;

    super.handleClickLang(selectedLang);

    this.setState({ currentValue: get(value, selectedLang, '') });
  }

  renderEditor() {
    const { editorLang } = this.props;
    const { currentValue } = this.state;

    if (!this.state.isLoadedEditor) {
      return null;
    }

    return (
      <AceEditor
        mode={editorLang}
        value={currentValue}
        enableSnippets
        enableBasicAutocompletion
        enableLiveAutocompletion
        setOptions={{
          useWorker: false,
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          showLineNumbers: true
        }}
        editorProps={{
          $blockScrolling: true
        }}
        name={this.#editorId}
        onChange={this.handleChangeEditor}
      />
    );
  }

  renderInputElement = () => {
    if (this.props.editor) {
      return this.renderEditor();
    }

    return <Textarea {...this.inputProps} value={this.value} onChange={this.handleChangeText} />;
  };
}

export default MlTextarea;
