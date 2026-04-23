import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import Records from '@/components/Records';
import { t } from '@/helpers/util';

import './SelectHierarchical.scss';

type ErrorCode = 'TYPE_NOT_RESOLVED' | 'ASSOCIATION_NOT_FOUND' | 'ASSOCIATION_NOT_SELF';

interface SelfAssociation {
  id?: string;
  attribute?: string;
  target?: string;
  name?: unknown;
}

interface SelectHierarchicalProps {
  value?: string | string[];
  multiple?: boolean;
  typeRef?: string;
  attribute?: string;
  selfAssociation?: SelfAssociation | null;
  associationTarget?: string;
  error?: ErrorCode;
  disabled?: boolean;
  viewOnly?: boolean;
  builderMode?: boolean;
  onChange?: (value: string | string[]) => void;
}

interface TreeNode {
  id: string;
  name: string;
  hasChildren: boolean;
}

interface AncestorPathItem {
  id: string;
  disp: string;
}

const MAX_ANCESTOR_DEPTH = 20;
const DEFAULT_CHILD_ATTRIBUTE = 'children';

const Labels = {
  PLACEHOLDER_SINGLE: 'select-hierarchical.placeholder.single',
  PLACEHOLDER_MULTIPLE: 'select-hierarchical.placeholder.multiple',
  SELECTED_COUNT: 'select-hierarchical.selected-count',
  ERROR_TYPE_NOT_RESOLVED: 'select-hierarchical.error.type-not-resolved',
  ERROR_ASSOCIATION_NOT_FOUND: 'select-hierarchical.error.association-not-found',
  ERROR_ASSOCIATION_NOT_SELF: 'select-hierarchical.error.association-not-self',
  EMPTY: 'select-hierarchical.empty',
  LOADING: 'select-hierarchical.loading',
  UNTITLED: 'select-hierarchical.untitled'
};

const ROOT_KEY = '__root__';

const toArray = (value?: string | string[]): string[] => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return value ? [value] : [];
};

const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

const extractTypeId = (ref: string): string => {
  if (!ref) {
    return '';
  }
  const atIdx = ref.indexOf('@');
  return atIdx >= 0 ? ref.substring(atIdx + 1) : ref;
};

const SelectHierarchical = ({
  value,
  multiple,
  typeRef,
  attribute,
  associationTarget,
  error,
  disabled,
  viewOnly,
  builderMode,
  onChange
}: SelectHierarchicalProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const [childrenByParent, setChildrenByParent] = useState<Record<string, TreeNode[]>>({});
  const [loadingByParent, setLoadingByParent] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [labelsByRef, setLabelsByRef] = useState<Record<string, string>>({});
  const [ancestorsByRef, setAncestorsByRef] = useState<Record<string, AncestorPathItem[]>>({});
  const [internalSelected, setInternalSelected] = useState<string[]>(() => toArray(value));

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  // Last value emitted to formio via onChange — used to ignore "echoes" coming
  // back as the value prop, which would otherwise reset internal state.
  const lastEmittedRef = useRef<string[] | null>(null);

  // Sync internal selection with incoming prop (form load / external updates)
  useEffect(() => {
    const next = toArray(value);

    // Ignore the prop change if it's just the formio wrapper echoing back
    // the value we just emitted.
    if (lastEmittedRef.current && arraysEqual(lastEmittedRef.current, next)) {
      lastEmittedRef.current = null;
      return;
    }

    setInternalSelected((prev: string[]) => (arraysEqual(prev, next) ? prev : next));
  }, [value]);

  const selectedRefs = internalSelected;
  const selectedSet = useMemo(() => new Set(selectedRefs), [selectedRefs]);

  // Resolve ancestor paths (for breadcrumb chips + auto-expand). Each selected
  // ref walks up the `_parent` chain collecting `_disp` for every ancestor.
  useEffect(() => {
    const unresolved = selectedRefs.filter((ref: string) => ref && !ancestorsByRef[ref]);
    if (unresolved.length === 0) {
      return;
    }

    let cancelled = false;

    const loadPath = async (ref: string): Promise<readonly [string, AncestorPathItem[]]> => {
      const path: AncestorPathItem[] = [];
      let current: string | null = ref;
      let depth = 0;
      while (current && depth < MAX_ANCESTOR_DEPTH) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const disp: string = await Records.get(current).load('_disp');
          // eslint-disable-next-line no-await-in-loop
          const nextParent: string | null = await Records.get(current).load('_parent?id');
          path.unshift({ id: current, disp: disp || current });
          current = nextParent || null;
        } catch (e) {
          console.error('[SelectHierarchical] ancestor chain load failed', e);
          break;
        }
        depth += 1;
      }
      return [ref, path] as const;
    };

    Promise.all(unresolved.map(loadPath)).then((entries: ReadonlyArray<readonly [string, AncestorPathItem[]]>) => {
      if (cancelled) {
        return;
      }
      setAncestorsByRef((prev: Record<string, AncestorPathItem[]>) => {
        const next = { ...prev };
        for (const [ref, path] of entries) {
          next[ref] = path;
        }
        return next;
      });
      setLabelsByRef((prev: Record<string, string>) => {
        const next = { ...prev };
        for (const [, path] of entries) {
          for (const item of path) {
            if (!next[item.id]) {
              next[item.id] = item.disp;
            }
          }
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [selectedRefs, ancestorsByRef]);

  const childAttributeName = attribute || DEFAULT_CHILD_ATTRIBUTE;

  const loadChildren = useCallback(
    async (parentRef: string | null) => {
      if (!typeRef) {
        return;
      }
      const key = parentRef || ROOT_KEY;

      setLoadingByParent((prev: Record<string, boolean>) => ({ ...prev, [key]: true }));

      const query = parentRef
        ? { t: 'eq', a: '_parent', val: parentRef }
        : { t: 'empty', a: '_parent' };

      try {
        const result: { records?: Array<{ id: string; name: string; childIds: string[] | null }> } = await Records.query(
          {
            ecosType: extractTypeId(typeRef),
            language: 'predicate',
            query
          },
          {
            id: '?id',
            name: '_disp',
            childIds: `${childAttributeName}[]?id`
          }
        );

        const records: TreeNode[] = (result?.records || []).map((r: { id: string; name: string; childIds: string[] | null }) => ({
          id: r.id,
          name: r.name || t(Labels.UNTITLED),
          hasChildren: Array.isArray(r.childIds) && r.childIds.length > 0
        }));

        setChildrenByParent((prev: Record<string, TreeNode[]>) => ({ ...prev, [key]: records }));
        setLabelsByRef((prev: Record<string, string>) => {
          const next = { ...prev };
          for (const rec of records) {
            if (!next[rec.id]) {
              next[rec.id] = rec.name;
            }
          }
          return next;
        });
      } catch (e) {
        console.error('[SelectHierarchical] failed to load nodes', e);
        setChildrenByParent((prev: Record<string, TreeNode[]>) => ({ ...prev, [key]: [] }));
      } finally {
        setLoadingByParent((prev: Record<string, boolean>) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [typeRef, childAttributeName]
  );

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    updatePosition();

    if (!childrenByParent[ROOT_KEY] && !loadingByParent[ROOT_KEY]) {
      loadChildren(null);
    }
  }, [isOpen, childrenByParent, loadingByParent, loadChildren, updatePosition]);

  // Auto-expand ancestors of selected refs so the user can see their selection
  // in context the moment the dropdown opens. Also lazy-loads each ancestor's
  // children so the tree expands visually all the way down.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const ancestorsToExpand = new Set<string>();
    for (const ref of selectedRefs) {
      const path = ancestorsByRef[ref];
      if (!path || path.length === 0) {
        continue;
      }
      // All items except the leaf (the last one = the selected record itself)
      for (let i = 0; i < path.length - 1; i++) {
        ancestorsToExpand.add(path[i].id);
      }
    }

    if (ancestorsToExpand.size === 0) {
      return;
    }

    setExpanded((prev: Record<string, boolean>) => {
      let changed = false;
      const next = { ...prev };
      ancestorsToExpand.forEach((id: string) => {
        if (!next[id]) {
          next[id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    ancestorsToExpand.forEach((id: string) => {
      if (!childrenByParent[id] && !loadingByParent[id]) {
        loadChildren(id);
      }
    });
  }, [isOpen, selectedRefs, ancestorsByRef, childrenByParent, loadingByParent, loadChildren]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const listener = (event: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', listener);
    return () => document.removeEventListener('pointerdown', listener);
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    if (!disabled && !error) {
      setIsOpen((prev: boolean) => !prev);
    }
  }, [disabled, error]);

  const handleToggleExpand = useCallback(
    (nodeRef: string) => {
      const willOpen = !expanded[nodeRef];
      setExpanded((prev: Record<string, boolean>) => ({ ...prev, [nodeRef]: willOpen }));
      if (willOpen && !childrenByParent[nodeRef] && !loadingByParent[nodeRef]) {
        loadChildren(nodeRef);
      }
    },
    [expanded, childrenByParent, loadingByParent, loadChildren]
  );

  const handleSelect = useCallback(
    (nodeRef: string) => {
      if (disabled) {
        return;
      }

      if (multiple) {
        const next = selectedSet.has(nodeRef) ? selectedRefs.filter((r: string) => r !== nodeRef) : [...selectedRefs, nodeRef];
        setInternalSelected(next);
        lastEmittedRef.current = next;
        onChange?.(next);
      } else {
        const nextSingle = selectedRefs[0] === nodeRef ? '' : nodeRef;
        const nextArr = nextSingle ? [nextSingle] : [];
        setInternalSelected(nextArr);
        lastEmittedRef.current = nextArr;
        onChange?.(nextSingle);
        setIsOpen(false);
      }
    },
    [disabled, multiple, selectedRefs, selectedSet, onChange]
  );

  if (error && !builderMode) {
    let message: string;
    if (error === 'ASSOCIATION_NOT_FOUND') {
      message = t(Labels.ERROR_ASSOCIATION_NOT_FOUND, { attribute: attribute || '', typeRef: typeRef || '' });
    } else if (error === 'ASSOCIATION_NOT_SELF') {
      message = t(Labels.ERROR_ASSOCIATION_NOT_SELF, {
        attribute: attribute || '',
        typeRef: typeRef || '',
        target: associationTarget || ''
      });
    } else {
      message = t(Labels.ERROR_TYPE_NOT_RESOLVED);
    }
    return (
      <div className="ecos-select-hierarchical">
        <div className="ecos-select-hierarchical__error">{message}</div>
      </div>
    );
  }

  const placeholderText = t(multiple ? Labels.PLACEHOLDER_MULTIPLE : Labels.PLACEHOLDER_SINGLE);

  const renderViewText = () => {
    if (selectedRefs.length === 0) {
      return <span className="ecos-select-hierarchical__view-empty">—</span>;
    }

    const labels = selectedRefs.map((ref: string) => {
      const path = ancestorsByRef[ref];

      if (path && path.length > 0) {
        return path[path.length - 1].disp;
      }

      return labelsByRef[ref] || ref;
    });

    return <span className="ecos-select-hierarchical__view-text">{labels.join(', ')}</span>;
  };

  const renderSelectedChips = () => {
    if (selectedRefs.length === 0) {
      return <span className="ecos-select-hierarchical__trigger-placeholder">{placeholderText}</span>;
    }

    return (
      <div className="ecos-select-hierarchical__chips">
        {selectedRefs.map((ref: string) => {
          const path = ancestorsByRef[ref];
          const isLoadingPath = !path;
          const fallbackLabel = labelsByRef[ref];

          if (isLoadingPath && !fallbackLabel) {
            return (
              <span
                key={ref}
                className="ecos-select-hierarchical__chip ecos-select-hierarchical__chip_loading"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                aria-busy="true"
              >
                <span className="ecos-select-hierarchical__chip-skeleton ecos-select-hierarchical__chip-skeleton_path" />
                <span className="ecos-select-hierarchical__chip-skeleton ecos-select-hierarchical__chip-skeleton_leaf" />
                {!disabled && !viewOnly && (
                  <button
                    type="button"
                    className="ecos-select-hierarchical__chip-close"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleSelect(ref);
                    }}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          }

          const fullPathText = path && path.length > 0 ? path.map((p: AncestorPathItem) => p.disp).join(' › ') : fallbackLabel || ref;
          const leafText = path && path.length > 0 ? path[path.length - 1].disp : fallbackLabel || ref;
          const parentPathText = path && path.length > 1 ? path.slice(0, -1).map((p: AncestorPathItem) => p.disp).join(' › ') : '';

          return (
            <span
              key={ref}
              className="ecos-select-hierarchical__chip"
              title={fullPathText}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {parentPathText && <span className="ecos-select-hierarchical__chip-path">{parentPathText} ›&nbsp;</span>}
              <span className="ecos-select-hierarchical__chip-leaf">{leafText}</span>
              {!disabled && (
                <button
                  type="button"
                  className="ecos-select-hierarchical__chip-close"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleSelect(ref);
                  }}
                  aria-label="Remove"
                >
                  ×
                </button>
              )}
            </span>
          );
        })}
      </div>
    );
  };

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const isExpanded = !!expanded[node.id];
    const isSelected = selectedSet.has(node.id);
    const children = childrenByParent[node.id];
    const isLoading = !!loadingByParent[node.id];
    const isLoaded = Array.isArray(children);

    return (
      <li key={node.id} className="ecos-select-hierarchical__node">
        <div className="ecos-select-hierarchical__node-row" style={{ paddingLeft: depth * 16 }}>
          {node.hasChildren ? (
            <span
              className={classNames('ecos-select-hierarchical__chevron', {
                'ecos-select-hierarchical__chevron_open': isExpanded
              })}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleToggleExpand(node.id);
              }}
            >
              <i className="fa fa-caret-right" />
            </span>
          ) : (
            <span className="ecos-select-hierarchical__chevron-spacer" />
          )}
          <label className="ecos-select-hierarchical__label">
            <input
              type={multiple ? 'checkbox' : 'radio'}
              checked={isSelected}
              disabled={disabled}
              onChange={() => handleSelect(node.id)}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
            <span className="ecos-select-hierarchical__name">{node.name}</span>
          </label>
        </div>
        {node.hasChildren && isExpanded && (
          <ul className="ecos-select-hierarchical__children">
            {isLoading && (
              <li className="ecos-select-hierarchical__info" style={{ paddingLeft: (depth + 1) * 16 }}>
                {t(Labels.LOADING)}
              </li>
            )}
            {!isLoading && isLoaded && children!.length === 0 && (
              <li className="ecos-select-hierarchical__info" style={{ paddingLeft: (depth + 1) * 16 }}>
                {t(Labels.EMPTY)}
              </li>
            )}
            {!isLoading && isLoaded && children!.map((child: TreeNode) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const rootNodes = childrenByParent[ROOT_KEY];
  const isRootLoading = !!loadingByParent[ROOT_KEY];

  if (viewOnly) {
    return <div className="ecos-select-hierarchical ecos-select-hierarchical_view-only">{renderViewText()}</div>;
  }

  return (
    <div className="ecos-select-hierarchical">
      <div
        ref={triggerRef}
        className={classNames('ecos-select-hierarchical__trigger', {
          'ecos-select-hierarchical__trigger_disabled': disabled,
          'ecos-select-hierarchical__trigger_open': isOpen,
          'ecos-select-hierarchical__trigger_empty': selectedRefs.length === 0
        })}
        onClick={handleToggle}
      >
        <div className="ecos-select-hierarchical__trigger-content">{renderSelectedChips()}</div>
        <span className="ecos-select-hierarchical__trigger-icon">&nbsp;
        </span>
      </div>

      {isOpen &&
        ReactDOM.createPortal(
          <div
            ref={popoverRef}
            className="ecos-select-hierarchical__popover"
            style={{ top: position.top, left: position.left, minWidth: position.width }}
          >
            {isRootLoading && <div className="ecos-select-hierarchical__info">{t(Labels.LOADING)}</div>}
            {!isRootLoading && Array.isArray(rootNodes) && rootNodes.length === 0 && (
              <div className="ecos-select-hierarchical__info">{t(Labels.EMPTY)}</div>
            )}
            {!isRootLoading && Array.isArray(rootNodes) && rootNodes.length > 0 && (
              <ul className="ecos-select-hierarchical__tree">{rootNodes.map((n: TreeNode) => renderNode(n, 0))}</ul>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default SelectHierarchical;
