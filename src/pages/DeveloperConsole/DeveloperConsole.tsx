import React, { useCallback, useState, useEffect, useRef } from 'react';

import CodeEditor from './CodeEditor';
import ResponsePanel from './ResponsePanel';
import EXAMPLES_DATA from './examplesData';

import EcosModal from '@/components/common/EcosModal/EcosModal';
import { Dropdown } from '@/components/common/form';
import { snippetsStore } from '@/helpers/indexedDB';
import { t } from '@/helpers/util';

import './DeveloperConsole.scss';

const STORAGE_KEYS = {
  CODE: 'developerConsole_code',
  PANEL_POSITION: 'developerConsole_panelPosition',
  PANEL_SIZE: 'developerConsole_panelSize',
  PANEL_LOCATION: 'developerConsole_panelLocation'
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

const DeveloperConsole = ({ hidden }: { hidden: boolean }) => {
  const [initialValue, setInitialValue] = useState('');

  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<any>(null);

  const [panelSize, setPanelSize] = useState(DEFAULT_PANEL_STATE);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });

  const [savedSnippets, setSavedSnippets] = useState<Snippet[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [snippetTitle, setSnippetTitle] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  const editorRef = useRef<any>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
      const savedPanelSize = localStorage.getItem(STORAGE_KEYS.PANEL_SIZE);
      const savedPanelPosition = localStorage.getItem(STORAGE_KEYS.PANEL_POSITION);
      const savedPanelLocation = localStorage.getItem(STORAGE_KEYS.PANEL_LOCATION);

      if (savedCode) {
        setInitialValue(savedCode);
      } else {
        setInitialValue(DEFAULT_CODE);
      }

      if (savedPanelSize) {
        try {
          setPanelSize(JSON.parse(savedPanelSize));
        } catch (parseErr) {
          console.warn('Could not parse panel size:', parseErr);
        }
      }

      if (savedPanelPosition) {
        try {
          setPanelPosition(JSON.parse(savedPanelPosition));
        } catch (parseErr) {
          console.warn('Could not parse panel position:', parseErr);
        }
      }

      if (savedPanelLocation) {
        setPanelSize(prev => ({ ...prev, location: savedPanelLocation }));
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err);
      setInitialValue(DEFAULT_CODE);
      setError(null);
    }

    loadSnippets();
  }, []);

  const handleExampleChange = (selectedOption: { value: string }) => {
    if (selectedOption && selectedOption.value) {
      const example = EXAMPLES_DATA.find(data => data.value === selectedOption.value);

      if (example) {
        setInitialValue(example.code);

        if (editorRef.current) {
          editorRef.current.setValue(example.code);
        }
      }
    }
  };

  const handleSnippetSelect = (selectedOption: { value: string }) => {
    if (selectedOption && selectedOption.value) {
      const snippet = savedSnippets.find(s => s.id === selectedOption.value);

      if (snippet) {
        setInitialValue(snippet.code);

        if (editorRef.current) {
          editorRef.current.setValue(snippet.code);
        }
      }
    }
  };

  const handleSaveCode = () => {
    setSnippetTitle('');
    setIsSaveModalOpen(true);
  };

  const handleSaveConfirm = async () => {
    const code = editorRef.current ? editorRef.current.getValue() : '';
    const title = snippetTitle.trim();

    if (!title || !code.trim()) {
      return;
    }

    const newSnippet: Snippet = {
      id: `snippet_${Date.now()}`,
      title,
      code,
      createdAt: Date.now()
    };

    await snippetsStore.put(newSnippet);
    setSavedSnippets(prev => [...prev, newSnippet]);

    setIsSaveModalOpen(false);
    setSnippetTitle('');
  };

  const handleDeleteSnippet = async (snippetId: string) => {
    await snippetsStore.delete(snippetId);
    setSavedSnippets(prev => prev.filter(s => s.id !== snippetId));
  };

  const handleCodeChange = (newCode: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CODE, newCode);
    } catch (error) {
      console.error('Error saving code to localStorage:', error);
    }
  };

  const savePanelState = useCallback((newSize: any, newPosition: any) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PANEL_SIZE, JSON.stringify(newSize));
      localStorage.setItem(STORAGE_KEYS.PANEL_POSITION, JSON.stringify(newPosition));
      localStorage.setItem(STORAGE_KEYS.PANEL_LOCATION, newSize.location);
    } catch (error) {
      console.error('Error saving panel state:', error);
    }
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      if (e.target instanceof HTMLElement && e.target.classList.contains('response-handle')) {
        return;
      }

      const isEdgeResize =
        e.target instanceof HTMLElement &&
        (e.target.classList.contains('resize-handle') || e.target.classList.contains('resize-handle-vertical'));

      if (!isEdgeResize) {
        return;
      }

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = panelSize.width;
      const startHeight = panelSize.height;

      const containerRect = containerRef.current?.getBoundingClientRect();
      const containerWidth = containerRect?.width || window.innerWidth;
      const containerHeight = containerRect?.height || window.innerHeight;

      const doResize = (moveEvent: MouseEvent) => {
        if (panelSize.location === 'bottom') {
          const heightDiff = startY - moveEvent.clientY;
          const newHeight = Math.max(100, Math.min(containerHeight - 200, startHeight + heightDiff));
          setPanelSize(prev => ({ ...prev, height: newHeight }));
        } else {
          const widthDiff = startX - moveEvent.clientX;
          const newWidth = Math.max(200, Math.min(containerWidth - 300, startWidth + widthDiff));
          setPanelSize(prev => ({ ...prev, width: newWidth }));
        }
      };

      const stopResize = () => {
        window.removeEventListener('mousemove', doResize);
        window.removeEventListener('mouseup', stopResize);
        savePanelState(panelSize, panelPosition);
      };

      window.addEventListener('mousemove', doResize);
      window.addEventListener('mouseup', stopResize);
    },
    [panelSize, panelPosition, savePanelState]
  );

  const togglePanelLocation = useCallback(() => {
    const newLocation = panelSize.location === 'bottom' ? 'right' : 'bottom';
    const newSize = { ...panelSize, location: newLocation };
    setPanelSize(newSize);
    savePanelState(newSize, panelPosition);
  }, [panelSize, panelPosition, savePanelState]);

  const executeCode = useCallback(async () => {
    const code = editorRef.current ? editorRef.current.getValue() : '';

    if (!code.trim()) {
      setResponse('No code to execute');
      return;
    }

    setLoading(true);
    setResponse('');

    try {
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

      const result = await eval(`(async () => { ${code} })()`);

      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;

      let output = '';

      if (logs.length > 0) {
        output += logs
          .map(([level, args]) => {
            const formattedArgs = args
              .map((arg: any) => {
                if (typeof arg === 'object') {
                  return JSON.stringify(arg, null, 2);
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
        const returnValue = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
        output += `Return value:\n${returnValue}`;
      }

      setResponse(output || 'Code executed successfully (no output)');
    } catch (error) {
      setResponse(`Error:\n${(error as Error).message}\n\nStack:\n${(error as Error).stack}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResponse = () => {
    setResponse('');
  };

  const snippetsSource = savedSnippets.map(s => ({
    value: s.id,
    label: s.title
  }));

  if (hidden) {
    return null;
  }

  return (
    <div ref={containerRef} className={`developer-console-container panel-location-${panelSize.location}`}>
      <div className="console-controls">
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={executeCode} disabled={loading}>
            {loading ? (
              t('developer-console.executing')
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff">
                  <path
                    fillRule="evenodd"
                    d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
                {t('developer-console.run-code')}
              </>
            )}
          </button>
          <button className="btn btn-secondary" onClick={handleSaveCode} disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#444444">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
              />
            </svg>
            {t('developer-console.save-code')}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const model = editorRef.current?.getModel();

              if (model) {
                model.undo();
              }
            }}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#444444">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const model = editorRef.current?.getModel();

              if (model) {
                model.redo();
              }
            }}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#444444">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
            </svg>
          </button>
        </div>
        <div className="action-buttons">
          <div className="example-selector">
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
            <div className="example-selector saved-snippets-selector">
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
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={togglePanelLocation} disabled={loading}>
            {panelSize.location === 'bottom' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#444444">
                <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#444444">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
              </svg>
            )}
          </button>
        </div>
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
          {initialValue && <CodeEditor editorRef={editorRef} defaultValue={initialValue} onCodeChange={handleCodeChange} />}
        </div>
        <div
          className="console-output"
          ref={panelRef}
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
    </div>
  );
};

export default DeveloperConsole;
