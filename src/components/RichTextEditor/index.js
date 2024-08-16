import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import PropTypes from 'prop-types';

import { EditorContent } from './EditorContent';
import { defaultTheme } from './themes';
import { nodes } from './nodes';

import './style.scss';

class Editor extends React.Component {
  static propTypes = {
    readonly: PropTypes.bool,
    hideToolbar: PropTypes.bool,
    onChange: PropTypes.func,
    editorState: PropTypes.string
  };

  initialConfig = {
    namespace: 'RichTextEditor',
    onError: error => console.error(error),
    theme: defaultTheme,
    nodes
  };

  render() {
    const { onChange, htmlString, readonly = false, hideToolbar = false } = this.props;

    return (
      <LexicalComposer initialConfig={this.initialConfig}>
        <EditorContent hideToolbar={hideToolbar} readonly={readonly} htmlString={htmlString} onChange={onChange} />
      </LexicalComposer>
    );
  }
}

export default Editor;
