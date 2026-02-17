import Editor, { BeforeMount } from '@monaco-editor/react';
import React, { useEffect, useRef, Suspense } from 'react';

import { Loader } from '@/components/common';

import './CodeEditor.scss';

const NATIVE_WINDOW_KEYS = new Set(Object.getOwnPropertyNames(Window.prototype));

function getWindowGlobals(): string[] {
  return Object.getOwnPropertyNames(window).filter(key => {
    if (key.startsWith('_') || key.startsWith('__')) return false;
    if (NATIVE_WINDOW_KEYS.has(key)) return false;
    return true;
  });
}

function resolveObjectByPath(path: string): any {
  const parts = path.split('.');
  let obj: any = window;

  for (const part of parts) {
    if (obj == null || typeof obj !== 'object') return undefined;
    obj = obj[part];
  }

  return obj;
}

function getObjectKeys(obj: any): string[] {
  if (obj == null) return [];

  const keys = new Set<string>();

  // own properties
  for (const key of Object.getOwnPropertyNames(obj)) {
    if (!key.startsWith('_')) keys.add(key);
  }

  // prototype properties (methods)
  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (!key.startsWith('_') && key !== 'constructor') keys.add(key);
    }
    proto = Object.getPrototypeOf(proto);
  }

  return Array.from(keys);
}

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
  const completionDisposable = useRef<any>(null);

  const handleEditorChange = (value: string | undefined, event: any) => {
    if (value !== undefined) {
      onCodeChange(value || '');
    }
  };

  const handleBeforeMount: BeforeMount = monaco => {
    completionDisposable.current?.dispose();

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      noLib: true
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true
    });

    completionDisposable.current = monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: ['.'],
      provideCompletionItems(
        model: {
          getValueInRange: (arg0: { startLineNumber: any; startColumn: number; endLineNumber: any; endColumn: any }) => any;
          getWordUntilPosition: (arg0: any) => any;
        },
        position: { lineNumber: any; column: any }
      ) {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        const dotMatch = textUntilPosition.match(/([\w]+(?:\.[\w]+)*)\.\w*$/);

        if (dotMatch) {
          const objectPath = dotMatch[1];
          const obj = resolveObjectByPath(objectPath);

          if (obj == null) return { suggestions: [] };

          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };

          const keys = getObjectKeys(obj);
          const suggestionsMap = new Map();

          keys.forEach(key => {
            let valueType = 'unknown';
            try {
              valueType = typeof obj[key];
            } catch {
              // ignore access errors
            }

            const kind =
              valueType === 'function'
                ? monaco.languages.CompletionItemKind.Method
                : valueType === 'object'
                  ? monaco.languages.CompletionItemKind.Module
                  : monaco.languages.CompletionItemKind.Property;

            suggestionsMap.set(key, {
              label: key,
              kind,
              insertText: key,
              detail: `${objectPath}.${key} (${valueType})`,
              range
            });
          });

          const suggestions = Array.from(suggestionsMap.values());

          return { suggestions };
        }

        // Top-level globals
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const globals = getWindowGlobals();
        const suggestionsMap = new Map();

        globals.forEach(key => {
          const value = (window as any)[key];
          const kind =
            typeof value === 'function'
              ? monaco.languages.CompletionItemKind.Function
              : typeof value === 'object'
                ? monaco.languages.CompletionItemKind.Module
                : monaco.languages.CompletionItemKind.Variable;

          suggestionsMap.set(key, {
            label: key,
            kind,
            insertText: key,
            detail: `window.${key} (${typeof value})`,
            range
          });
        });

        const suggestions = Array.from(suggestionsMap.values());

        return { suggestions };
      }
    });
  };

  useEffect(() => {
    editorRef.current?.focus();

    return () => {
      completionDisposable.current?.dispose();
    };
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
          beforeMount={handleBeforeMount}
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
            readOnly: false,
            wordBasedSuggestions: 'off'
          }}
        />
      </Suspense>
    </div>
  );
};

export default CodeEditor;
