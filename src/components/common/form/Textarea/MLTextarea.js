import React from 'react';
import AceEditor from 'react-ace';
import PropTypes from 'prop-types';

import Textarea from './Textarea';
import BaseMLField from '../BaseMLField';
import { getHtmlIdByUid } from '../../../../helpers/util';

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

  #editorId = getHtmlIdByUid('ml-textarea');

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      isLoadedEditor: false
    };

    if (props.editor) {
      this.loadEditor();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);

    if (this.props.editor && !prevProps.editor) {
      this.loadEditor();
    }
  }

  get ignoredProps() {
    return [...super.ignoredProps, 'editor', 'editorLang'];
  }

  loadEditor() {
    window.require(
      [
        `/js/lib/ace/1.4.1/mode-${this.props.editorLang}.js`,
        '/js/lib/ace/1.4.1/theme-monokai.js',
        '/js/lib/ace/1.4.1/ext-language_tools.js',
        `/js/lib/ace/1.4.1/snippets/${this.props.editorLang}.js`
      ],
      () => {
        this.setState({ isLoadedEditor: true });
      }
    );
  }

  handleChangeEditor = (value, event) => {
    console.warn({
      value,
      event
    });
    this.handleChangeText({ target: { value } });
  };

  renderEditor() {
    const { editorLang } = this.props;

    if (!this.state.isLoadedEditor) {
      return null;
    }

    return (
      <AceEditor
        mode={editorLang}
        value={this.value}
        enableBasicAutocompletion
        enableLiveAutocompletion
        setOptions={{
          useWorker: false,
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          showLineNumbers: true
        }}
        debounceChangePeriod={300}
        editorProps={{ $blockScrolling: true }}
        name={this.#editorId}
        onChange={this.handleChangeEditor}
        // todo: возможно, стоит перенести работу над editor сюда (темы, сниппеты, тулзы)
        onLoad={(...data) => console.warn(data)}
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
