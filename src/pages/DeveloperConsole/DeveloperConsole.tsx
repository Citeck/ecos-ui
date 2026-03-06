import _ from 'lodash';
import React, { useCallback, useState, useEffect, useRef } from 'react';

import ResponsePanel from './ResponsePanel';
import EXAMPLES_DATA from './examplesData';
import { safeStringify } from './utils';

import CodeEditor from '@/components/MonacoEditor/CodeEditor';
import Records from '@/components/Records';
import EcosModal from '@/components/common/EcosModal/EcosModal';
import { Dropdown } from '@/components/common/form';
import ScriptEditorAIButton from '@/components/AIAssistant/ScriptEditorAIButton';
import { SCRIPT_CONTEXT_TYPES } from '@/components/AIAssistant/types';
import { snippetsStore } from '@/helpers/indexedDB';
import { t } from '@/helpers/util';

import './DeveloperConsole.scss';

const STORAGE_KEYS = {
  CODE: 'developerConsole_code',
  PANEL_SIZE: 'developerConsole_panelSize'
};

interface Snippet {
  id: string;
  title: string;
  code: string;
  createdAt: number;
}

const DEFAULT_PANEL_STATE = {
  width: 400,
  height: 300,
  location: 'bottom'
};

const DEFAULT_CODE = '// Write your JavaScript code here\nconsole.log("Hello from Developer Console!");';
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);

    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn(`Could not parse ${key}:`, err);
  }

  return fallback;
};

const DeveloperConsole = ({ hidden }: { hidden: boolean }) => {
  const [initialValue, setInitialValue] = useState('');

  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const [panelSize, setPanelSize] = useState(() => loadFromStorage(STORAGE_KEYS.PANEL_SIZE, DEFAULT_PANEL_STATE));

  const [savedSnippets, setSavedSnippets] = useState<Snippet[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState('');
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [deleteConfirmSnippet, setDeleteConfirmSnippet] = useState<Snippet | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const closeAIRef = useRef<(() => void) | null>(null);
  const pendingSaveRef = useRef<(() => void) | null>(null);
  const deleteConfirmedRef = useRef(false);

  const editorRef = useRef<any>(null);

  const panelSizeRef = useRef(panelSize);
  panelSizeRef.current = panelSize;

  const loadSnippets = useCallback(async () => {
    try {
      const all = await snippetsStore.getAll();
      setSavedSnippets(all);
    } catch (err) {
      console.error('Error loading snippets from IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    try {
      const savedCode = localStorage.getItem(STORAGE_KEYS.CODE);
      setInitialValue(savedCode || DEFAULT_CODE);
    } catch (err) {
      console.error('Error loading from localStorage:', err);
      setInitialValue(DEFAULT_CODE);
    }

    loadSnippets();
  }, []);

  const handleEditorMount = useCallback((editor: any) => {
    const model = editor.getModel();
    if (model) {
      setCanUndo(model.canUndo());
      setCanRedo(model.canRedo());
      model.onDidChangeContent(() => {
        setCanUndo(model.canUndo());
        setCanRedo(model.canRedo());
      });
    }
  }, []);

  const handleExampleChange = (selectedOption: { value: string }) => {
    closeAIRef.current?.();
    if (selectedOption && selectedOption.value) {
      const example = EXAMPLES_DATA.find(data => data.value === selectedOption.value);

      if (example) {
        setInitialValue(example.code);
        setActiveSnippetId(null);
        setEditorValue(example.code);
        editorRef.current?.focus();
      }
    }
  };

  const handleSnippetSelect = (selectedOption: { value: string }) => {
    closeAIRef.current?.();
    if (selectedOption && selectedOption.value) {
      const snippet = savedSnippets.find(s => s.id === selectedOption.value);

      if (snippet) {
        setInitialValue(snippet.code);
        setActiveSnippetId(snippet.id);
        setEditorValue(snippet.code);
        editorRef.current?.focus();
      }
    }
  };

  const handleSaveCode = () => {
    closeAIRef.current?.();
    const activeSnippet = activeSnippetId ? savedSnippets.find(s => s.id === activeSnippetId) : null;
    setSnippetTitle(activeSnippet ? activeSnippet.title : '');
    setIsSaveModalOpen(true);
  };

  const handleSaveConfirm = async () => {
    const code = editorRef.current ? editorRef.current.getValue() : '';
    const title = snippetTitle.trim();

    if (!title || !code.trim()) {
      return;
    }

    const existingSnippet = savedSnippets.find(s => s.title.toLowerCase() === title.toLowerCase());

    if (existingSnippet) {
      const updated: Snippet = {
        ...existingSnippet,
        code,
        createdAt: Date.now()
      };

      await snippetsStore.put(updated);
      pendingSaveRef.current = () => {
        setSavedSnippets(prev => prev.map(s => (s.id === existingSnippet.id ? updated : s)));
        setActiveSnippetId(existingSnippet.id);
      };
    } else {
      const newSnippet: Snippet = {
        id: `snippet_${Date.now()}`,
        title,
        code,
        createdAt: Date.now()
      };

      await snippetsStore.put(newSnippet);
      pendingSaveRef.current = () => {
        setSavedSnippets(prev => [...prev, newSnippet]);
        setActiveSnippetId(newSnippet.id);
      };
    }

    setIsSaveModalOpen(false);
  };

  const handleSaveModalClosed = () => {
    setSnippetTitle('');
    if (pendingSaveRef.current) {
      pendingSaveRef.current();
      pendingSaveRef.current = null;
    }
  };

  const handleDeleteSnippet = (snippetId: string) => {
    const snippet = savedSnippets.find(s => s.id === snippetId);
    if (snippet) {
      setDeleteConfirmSnippet(snippet);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmSnippet) return;
    deleteConfirmedRef.current = true;
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteDialogClosed = async () => {
    const snippetToDelete = deleteConfirmSnippet;
    const confirmed = deleteConfirmedRef.current;

    setDeleteConfirmSnippet(null);
    deleteConfirmedRef.current = false;

    if (!confirmed || !snippetToDelete) return;

    await snippetsStore.delete(snippetToDelete.id);
    setSavedSnippets(prev => prev.filter(s => s.id !== snippetToDelete.id));

    if (activeSnippetId === snippetToDelete.id) {
      setActiveSnippetId(null);
    }
  };

  const handleCodeChange = useCallback((newCode: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CODE, newCode);
    } catch (error) {
      console.error('Error saving code to localStorage:', error);
    }
  }, []);

  const getEditorValue = useCallback((): string => {
    return editorRef.current ? editorRef.current.getValue() : '';
  }, []);

  const setEditorValue = useCallback(
    (value: string): void => {
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          model.pushEditOperations([], [{ range: model.getFullModelRange(), text: value }], () => null);
        } else {
          editorRef.current.setValue(value);
        }
        handleCodeChange(value);
      }
    },
    [handleCodeChange]
  );

  const savePanelState = useCallback((newSize: typeof DEFAULT_PANEL_STATE) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PANEL_SIZE, JSON.stringify(newSize));
    } catch (error) {
      console.error('Error saving panel state:', error);
    }
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      const isEdgeResize =
        e.target instanceof HTMLElement &&
        (e.target.classList.contains('resize-handle') || e.target.classList.contains('resize-handle-vertical'));

      if (!isEdgeResize) {
        return;
      }

      const startX = e.clientX;
      const startY = e.clientY;
      const currentPanelSize = panelSizeRef.current;
      const startWidth = currentPanelSize.width;
      const startHeight = currentPanelSize.height;
      const location = currentPanelSize.location;

      const containerRect = containerRef.current?.getBoundingClientRect();
      const containerWidth = containerRect?.width || window.innerWidth;
      const containerHeight = containerRect?.height || window.innerHeight;

      let currentSize = { ...currentPanelSize };

      const doResize = (moveEvent: MouseEvent) => {
        if (location === 'bottom') {
          const heightDiff = startY - moveEvent.clientY;
          const newHeight = Math.max(100, Math.min(containerHeight - 200, startHeight + heightDiff));
          currentSize = { ...currentSize, height: newHeight };
          setPanelSize(prev => ({ ...prev, height: newHeight }));
        } else {
          const widthDiff = startX - moveEvent.clientX;
          const newWidth = Math.max(200, Math.min(containerWidth - 300, startWidth + widthDiff));
          currentSize = { ...currentSize, width: newWidth };
          setPanelSize(prev => ({ ...prev, width: newWidth }));
        }
      };

      const stopResize = () => {
        window.removeEventListener('mousemove', doResize);
        window.removeEventListener('mouseup', stopResize);
        savePanelState(currentSize);
      };

      window.addEventListener('mousemove', doResize);
      window.addEventListener('mouseup', stopResize);
    },
    [savePanelState]
  );

  const togglePanelLocation = useCallback(() => {
    setPanelSize(prev => {
      const newSize = { ...prev, location: prev.location === 'bottom' ? 'right' : 'bottom' };
      savePanelState(newSize);
      return newSize;
    });
  }, [savePanelState]);

  const executeCode = useCallback(async () => {
    const code = editorRef.current ? editorRef.current.getValue() : '';

    if (!code.trim()) {
      setResponse('No code to execute');
      return;
    }

    setLoading(true);
    setResponse('');

    const logs: [string, any[]][] = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args) => {
      logs.push(['log', args]);
      originalLog(...args);
    };

    console.error = (...args) => {
      logs.push(['error', args]);
      originalError(...args);
    };

    console.warn = (...args) => {
      logs.push(['warn', args]);
      originalWarn(...args);
    };

    console.info = (...args) => {
      logs.push(['info', args]);
      originalInfo(...args);
    };

    // Track all promises from Records method calls to catch unawaited errors
    const trackedPromises: Promise<any>[] = [];

    function makeTrackedProxy(target: any): any {
      return new Proxy(target, {
        get(t: any, prop: string | symbol) {
          const value = t[prop];
          if (typeof value === 'function') {
            return (...args: any[]) => {
              const result = value.apply(t, args);
              if (result && typeof result.then === 'function') {
                result.catch(() => {}); // prevent unhandled rejection event
                trackedPromises.push(result);
                return result;
              }
              // Wrap non-promise objects (e.g. RecordImpl from Records.get())
              if (result && typeof result === 'object') {
                return makeTrackedProxy(result);
              }
              return result;
            };
          }
          return value;
        }
      });
    }

    const trackedRecords = makeTrackedProxy(Records);

    try {
      const func = new AsyncFunction(
        'Records',
        'Citeck',
        '_',
        'console',
        `
        ${code};
      `
      );

      const result = await func(trackedRecords, window.Citeck, _, console);

      // Wait for all async operations (including unawaited) to complete.
      // Drain loop: chained async calls may add new promises after initial batch settles.
      let prevLen = 0;
      while (trackedPromises.length > prevLen) {
        prevLen = trackedPromises.length;
        await Promise.allSettled(trackedPromises);
      }

      const settled = await Promise.allSettled(trackedPromises);
      const asyncErrors = settled
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => (r.reason instanceof Error ? r.reason : new Error(String(r.reason))));

      let output = '';

      if (logs.length > 0) {
        output += logs
          .map(([level, args]) => {
            const formattedArgs = args
              .map((arg: any) => {
                if (typeof arg === 'object') {
                  return safeStringify(arg, 2);
                }
                return String(arg);
              })
              .join(' ');
            return `[${level.toUpperCase()}] ${formattedArgs}`;
          })
          .join('\n');
      }

      if (result !== undefined) {
        if (output) output += '\n\n';
        const returnValue = typeof result === 'object' ? safeStringify(result, 2) : String(result);
        output += `Return value:\n${returnValue}`;
      }

      if (asyncErrors.length > 0) {
        if (output) output += '\n\n';
        output += asyncErrors.map(err => `Error:\n${err.message}${err.stack ? `\n\nStack:\n${err.stack}` : ''}`).join('\n\n');
      }

      setResponse(output || 'Code executed successfully (no output)');
    } catch (error) {
      setResponse(`Error:\n${(error as Error).message}\n\nStack:\n${(error as Error).stack}`);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      setLoading(false);
    }
  }, []);

  const clearResponse = () => {
    setResponse('');
  };

  const handleRegisterClose = useCallback((fn: () => void) => {
    closeAIRef.current = fn;
  }, []);

  const handleClearEditor = useCallback(() => {
    setEditorValue('');
  }, [setEditorValue]);

  const handleToolbarGroupClick = useCallback((e: React.MouseEvent) => {
    // Ignore clicks from portalled elements (AI popups rendered outside this DOM node)
    if (!(e.currentTarget as Node).contains(e.target as Node)) return;

    const aiWrapper = (e.currentTarget as Element).querySelector('.script-editor-ai-button-wrapper');
    if (aiWrapper && aiWrapper.contains(e.target as Node)) return;
    closeAIRef.current?.();
  }, []);

  const snippetsSource = savedSnippets.map(s => ({
    value: s.id,
    label: s.title
  }));

  if (hidden) {
    return null;
  }

  return (
    <div ref={containerRef} className={`developer-console-container panel-location-${panelSize.location}`}>
      <div className="console-toolbar">
        <div className="console-toolbar__group" onClick={handleToolbarGroupClick}>
          <button
            className="console-toolbar__btn console-toolbar__btn--run"
            onClick={executeCode}
            disabled={loading}
            data-tooltip={t('developer-console.run-code')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          </button>
          <span className="console-toolbar__separator" />
          <button
            className="console-toolbar__btn"
            onClick={() => {
              const model = editorRef.current?.getModel();
              if (model) {
                model.undo();
              }
            }}
            disabled={!canUndo}
            data-tooltip={t('developer-console.undo')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
          </button>
          <button
            className="console-toolbar__btn"
            onClick={() => {
              const model = editorRef.current?.getModel();
              if (model) {
                model.redo();
              }
            }}
            disabled={!canRedo}
            data-tooltip={t('developer-console.redo')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
            </svg>
          </button>
          <button
            className="console-toolbar__btn"
            onClick={handleClearEditor}
            data-tooltip={t('developer-console.clear-editor')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z" />
            </svg>
          </button>
          <span className="console-toolbar__separator" />
          <ScriptEditorAIButton
            recordRef=""
            scriptContextType={SCRIPT_CONTEXT_TYPES.DEV_CONSOLE}
            getEditorValue={getEditorValue}
            setEditorValue={setEditorValue}
            language="javascript"
            positionVariant="text-field"
            onRegisterClose={handleRegisterClose}
          />
          <span className="console-toolbar__separator" />
          <button className="console-toolbar__btn" onClick={handleSaveCode} data-tooltip={t('developer-console.save-code')}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
              />
            </svg>
          </button>
          <div className="console-toolbar__dropdown">
            <Dropdown
              controlLabel={t('developer-console.select-example')}
              className="console-example-dropdown"
              source={EXAMPLES_DATA}
              valueField="value"
              titleField="label"
              hasEmpty
              isStatic
              onChange={handleExampleChange}
            />
          </div>
          {snippetsSource.length > 0 && (
            <div className="console-toolbar__dropdown">
              <Dropdown
                controlLabel={t('developer-console.saved-snippets')}
                className="console-example-dropdown"
                source={snippetsSource}
                valueField="value"
                titleField="label"
                hasEmpty
                isStatic
                onChange={handleSnippetSelect}
                CustomItem={({ item, onClick }: { item: any; onClick: any }) => (
                  <li className="saved-snippet-item">
                    <span className="saved-snippet-item__title" onClick={() => onClick(item)}>
                      {item.label}
                    </span>
                    <button
                      className="btn btn-xxs"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onClick(null);
                        handleDeleteSnippet(item.value);
                      }}
                      title={t('developer-console.delete-snippet')}
                    >
                      &times;
                    </button>
                  </li>
                )}
              />
            </div>
          )}
        </div>
        <button
          className="console-toolbar__btn"
          onClick={togglePanelLocation}
          data-tooltip={panelSize.location === 'bottom' ? t('developer-console.panel-right') : t('developer-console.panel-bottom')}
        >
          {panelSize.location === 'bottom' ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
            </svg>
          )}
        </button>
      </div>
      <div className="developer-console">
        <div
          className="console-editor"
          style={
            panelSize.location === 'bottom'
              ? { flex: `1 1 calc(100% - ${panelSize.height}px)` }
              : { flex: `1 1 calc(100% - ${panelSize.width}px)` }
          }
        >
          {initialValue && (
            <CodeEditor
              editorRef={editorRef}
              defaultValue={initialValue}
              onCodeChange={handleCodeChange}
              onExecute={executeCode}
              onEditorMount={handleEditorMount}
            />
          )}
        </div>
        <div
          className="console-output"
          style={panelSize.location === 'bottom' ? { flex: `0 0 ${panelSize.height}px` } : { flex: `0 0 ${panelSize.width}px` }}
        >
          {panelSize.location === 'bottom' && <div className="resize-handle" onMouseDown={handleResizeStart} />}
          {panelSize.location === 'right' && <div className="resize-handle-vertical" onMouseDown={handleResizeStart} />}
          <ResponsePanel
            response={response}
            loading={loading}
            onClear={clearResponse}
            location={panelSize.location}
            width={panelSize.width}
            height={panelSize.height}
          />
        </div>
      </div>

      <EcosModal
        isOpen={isSaveModalOpen}
        size="xs"
        hideModal={() => setIsSaveModalOpen(false)}
        title={t('developer-console.save-modal.title')}
        reactstrapProps={{ onClosed: handleSaveModalClosed }}
      >
        <div className="save-snippet-modal">
          <label className="save-snippet-modal__label">{t('developer-console.save-modal.label')}</label>
          <input
            className="form-control save-snippet-modal__input"
            type="text"
            value={snippetTitle}
            onChange={e => setSnippetTitle(e.target.value)}
            placeholder={t('developer-console.save-modal.placeholder')}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSaveConfirm();
              }
            }}
          />
          {snippetTitle.trim() && savedSnippets.find(s => s.title.toLowerCase() === snippetTitle.trim().toLowerCase()) && (
            <p className="save-snippet-modal__hint">{t('developer-console.save-modal.update-hint')}</p>
          )}
          <div className="save-snippet-modal__buttons">
            <button className="btn btn-secondary" onClick={() => setIsSaveModalOpen(false)}>
              {t('developer-console.save-modal.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSaveConfirm} disabled={!snippetTitle.trim()}>
              {t('developer-console.save-modal.save')}
            </button>
          </div>
        </div>
      </EcosModal>

      <EcosModal
        isOpen={isDeleteDialogOpen}
        size="xs"
        hideModal={() => setIsDeleteDialogOpen(false)}
        title={t('developer-console.delete-snippet')}
        reactstrapProps={{ onClosed: handleDeleteDialogClosed }}
      >
        <div className="save-snippet-modal">
          <p>{deleteConfirmSnippet ? t('developer-console.delete-snippet.confirm', { title: deleteConfirmSnippet.title }) : ''}</p>
          <div className="save-snippet-modal__buttons">
            <button className="btn btn-secondary" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('developer-console.save-modal.cancel')}
            </button>
            <button className="btn btn-danger" onClick={handleDeleteConfirm}>
              {t('developer-console.delete-snippet')}
            </button>
          </div>
        </div>
      </EcosModal>
    </div>
  );
};

export default DeveloperConsole;
