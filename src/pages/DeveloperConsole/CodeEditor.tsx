import Editor from '@monaco-editor/react';
import React, { useEffect, Suspense } from 'react';

import { Loader } from '@/components/common';

import './CodeEditor.scss';

const CodeEditor = ({
  editorRef,
  defaultValue,
  onCodeChange,
  language = 'javascript'
}: {
  editorRef: React.RefObject<any>;
  defaultValue: string;
  onCodeChange: (value: string) => void;
  language?: string;
}): React.JSX.Element => {
  const handleEditorChange = (value: string | undefined, event: any) => {
    if (value !== undefined) {
      onCodeChange(value || '');
    }
  };

  useEffect(() => {
    editorRef.current?.focus();
  }, []);

  return (
    <div className="code-editor-container" tabIndex={-1}>
      <Suspense
        fallback={
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Loader rounded />
          </div>
        }
      >
        <Editor
          height="100%"
          language={language}
          defaultValue={defaultValue}
          onChange={handleEditorChange}
          onMount={editor => (editorRef.current = editor)}
          options={{
            saveViewState: true,
            keepCurrentModel: true,
            contextmenu: false,
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 1.6,
            wordWrap: 'on',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            formatOnType: true,
            showFoldingControls: 'always',
            scrollBeyondLastLine: false,
            scrollBeyondLastColumn: 0,
            renderWhitespace: 'none',
            readOnly: false
          }}
        />
      </Suspense>
    </div>
  );
};

export default CodeEditor;
