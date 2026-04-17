import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import FormManager from '@/components/EcosForm/FormManager';
import Records from '@/components/Records';
import { Icon } from '@/components/common';
import { t } from '@/helpers/util';

import ViewTabs from '../ViewTabs';

import './HierarchyView.scss';

const ROOT_KEY = '__root__';

const extractTypeId = (ref) => {
  if (!ref) return '';
  const atIdx = ref.indexOf('@');
  return atIdx >= 0 ? ref.substring(atIdx + 1) : ref;
};

function buildTree(records) {
  const byParent = {};
  const hasChildrenSet = new Set();
  const childCount = {};

  for (const rec of records) {
    const parentKey = rec.parentId || ROOT_KEY;
    if (!byParent[parentKey]) byParent[parentKey] = [];
    byParent[parentKey].push({ id: rec.id, name: rec.name });
    if (rec.parentId) {
      hasChildrenSet.add(rec.parentId);
      childCount[rec.parentId] = (childCount[rec.parentId] || 0) + 1;
    }
  }

  const result = {};
  for (const key of Object.keys(byParent)) {
    result[key] = byParent[key]
      .map(node => ({
        ...node,
        hasChildren: hasChildrenSet.has(node.id),
        childCount: childCount[node.id] || 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return result;
}

// True when `nodeId` is the same as `ancestorId` or any of its descendants.
function isDescendantOrSelf(nodeId, ancestorId, tree) {
  if (!nodeId || !ancestorId) return false;
  if (nodeId === ancestorId) return true;

  const stack = [ancestorId];
  const seen = new Set();
  while (stack.length) {
    const current = stack.pop();
    if (seen.has(current)) continue;
    seen.add(current);
    const children = tree[current] || [];
    for (const child of children) {
      if (child.id === nodeId) return true;
      stack.push(child.id);
    }
  }
  return false;
}

function collectAllExpandable(tree) {
  const ids = {};
  for (const key of Object.keys(tree)) {
    for (const node of tree[key]) {
      if (node.hasChildren) ids[node.id] = true;
    }
  }
  return ids;
}

// ── Chevron icons (same as hierarchical tree widget) ──

const ChevronRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <path d="M10.5 21L17.5 14L10.5 7" stroke="#606060" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDown = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <path d="M7 10.5L14 17.5L21 10.5" stroke="#606060" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Tree Node ──

const TreeNodeRow = ({
  node,
  tree,
  expanded,
  selectedId,
  sourceId,
  childAssocAttr,
  canCreate,
  permissionsById,
  onToggle,
  onClick,
  onReload,
  isParentLevel
}) => {
  const nodePerms = permissionsById[node.id] || {};
  const canWrite = !!nodePerms.canWrite;
  const canDelete = !!nodePerms.canDelete;
  const isOpen = !!expanded[node.id];
  const isActive = selectedId && selectedId.includes(node.id);
  const children = tree[node.id] || [];
  const filteredChildren = children.filter(c => !!c.id);
  const [displayName, setDisplayName] = useState(node.name);

  // Watch for name changes
  useEffect(() => {
    const rec = Records.get(node.id);
    if (rec && rec.watch) {
      rec.watch(['_disp'], updated => {
        if (updated._disp) setDisplayName(updated._disp);
      });
    }
  }, [node.id]);

  const handleEdit = (e) => {
    e.stopPropagation();
    FormManager.openFormModal({
      record: node.id,
      onSubmit: () => onReload()
    });
  };

  const handleCreate = (e) => {
    e.stopPropagation();
    FormManager.openFormModal({
      record: `${sourceId}@`,
      attributes: {
        _parent: node.id,
        _parentAtt: childAssocAttr || 'children'
      },
      onSubmit: () => onReload()
    });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    Records.remove([node.id]).then(() => onReload());
  };

  // Drag handlers
  const dragCounter = useRef(0);
  const [isHoverDrag, setIsHoverDrag] = useState(false);

  const onDragEnter = () => { dragCounter.current += 1; if (dragCounter.current > 0) setIsHoverDrag(true); };
  const onDragLeave = () => { dragCounter.current -= 1; if (dragCounter.current <= 0) { dragCounter.current = 0; setIsHoverDrag(false); } };
  const onDragOver = (e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch (_) {} };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsHoverDrag(false);
    const recordRef = e.dataTransfer && e.dataTransfer.getData('text/plain');
    if (!recordRef) return;
    // Disallow drop on self or on any of own descendants — would otherwise create a cycle.
    if (isDescendantOrSelf(node.id, recordRef, tree)) return;
    const rec = Records.getRecordToEdit(recordRef);
    rec.att('_parent', node.id);
    rec.att('_parentAtt', childAssocAttr || 'children');
    rec.save().then(() => onReload());
  };

  return (
    <details open={isOpen}>
      <summary
        className={classNames('ehv-summary', {
          'ehv-summary_active': isActive,
          'ehv-summary_hover-drag': isHoverDrag
        })}
        draggable={canWrite}
        onClick={() => onClick(node)}
        onClickCapture={e => e.preventDefault()}
        onDragStart={canWrite ? e => {
          e.stopPropagation();
          e.dataTransfer.setData('text/plain', node.id);
          e.dataTransfer.effectAllowed = 'move';
        } : undefined}
        onDragEnter={canWrite ? onDragEnter : undefined}
        onDragOver={canWrite ? onDragOver : undefined}
        onDragLeave={canWrite ? onDragLeave : undefined}
        onDrop={canWrite ? onDrop : undefined}
      >
        {filteredChildren.length > 0 && (
          <div
            className="ehv-summary__btn"
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
        <label className={classNames('ehv-summary__label', { 'ehv-summary__label_parent': isParentLevel })}>
          {displayName}
          {node.childCount > 0 && (
            <span className="ehv-summary__count">{node.childCount}</span>
          )}
        </label>
        {(canWrite || canCreate || canDelete) && (
          <div className="ehv-summary__actions">
            <div className="ehv-summary__actions-inner">
              {canWrite && <Icon className="icon-edit" onClick={handleEdit} />}
              {canCreate && <Icon className="icon-plus" onClick={handleCreate} />}
              {canDelete && <Icon className="icon-delete" onClick={handleDelete} />}
            </div>
          </div>
        )}
      </summary>
      {isOpen && filteredChildren.length > 0 && (
        <ul className="ehv-summary__children">
          {filteredChildren.map(child => (
            <li
              key={child.id}
              className={classNames('ehv-child', {
                'ehv-child_active': selectedId && selectedId.includes(child.id),
                'ehv-child_leaf': !child.hasChildren
              })}
            >
              <TreeNodeRow
                node={child}
                tree={tree}
                expanded={expanded}
                selectedId={selectedId}
                sourceId={sourceId}
                childAssocAttr={childAssocAttr}
                canCreate={canCreate}
                permissionsById={permissionsById}
                onToggle={onToggle}
                onClick={onClick}
                onReload={onReload}
                isParentLevel={false}
              />
            </li>
          ))}
        </ul>
      )}
    </details>
  );
};

// ── Main View ──

const HierarchyView = ({
  stateId,
  journalId,
  onRowClick,
  selectedRecordId,
  bodyTopForwardedRef,
  bodyClassName,
  getMaxHeight
}) => {
  const [tree, setTree] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [resolvedTypeId, setResolvedTypeId] = useState('');
  const [resolvedTypeRef, setResolvedTypeRef] = useState('');
  const [childAssocAttr, setChildAssocAttr] = useState('children');
  const [canCreate, setCanCreate] = useState(false);
  const [permissionsById, setPermissionsById] = useState({});

  // Resolve type from journal
  useEffect(() => {
    if (!journalId) return;
    let cancelled = false;
    const journalRef = journalId.includes('@') ? journalId : `uiserv/journal@${journalId}`;

    Records.get(journalRef)
      .load('typeRef?id')
      .then(typeRef => {
        if (cancelled || !typeRef) return;
        setResolvedTypeRef(typeRef);
        setResolvedTypeId(extractTypeId(typeRef));

        // Detect child self-association name
        Records.get(typeRef)
          .load('model.attributes[]{id,type,configTypeRef:config.typeRef,configChild:config.child?bool}')
          .then(attrs => {
            if (cancelled || !Array.isArray(attrs)) return;
            const selfAssoc = attrs.find(a => a.type === 'ASSOC' && a.configTypeRef === typeRef && a.configChild === true);
            if (selfAssoc) setChildAssocAttr(selfAssoc.id);
          });

        Records.get(typeRef)
          .load('createVariants[]{recordRef}')
          .then(variants => {
            if (!cancelled) setCanCreate(Array.isArray(variants) && variants.length > 0);
          });
      });

    return () => { cancelled = true; };
  }, [journalId]);

  const loadAllRecords = useCallback((preserveExpanded = false) => {
    if (!resolvedTypeId) return;
    setLoading(true);
    setTree({});
    setTotalCount(0);

    if (!preserveExpanded) {
      setExpanded({});
    }

    Records.query(
      { ecosType: resolvedTypeId, language: 'predicate', query: {}, page: { maxItems: 10000 } },
      { id: '?id', name: '_disp', parentId: '_parent?id' }
    )
      .then(result => {
        const records = (result?.records || []).map(r => ({
          id: r.id,
          name: r.name || t('select-hierarchical.untitled'),
          parentId: r.parentId || null
        }));
        const treeMap = buildTree(records);
        setTree(treeMap);
        setTotalCount(records.length);

        Promise.all(
          records.map(r =>
            Records.get(r.id)
              .load({ canWrite: 'permissions._has.Write?bool', canDelete: 'permissions._has.Delete?bool' })
              .then(p => ({ id: r.id, canWrite: !!p.canWrite, canDelete: !!p.canDelete }))
              .catch(() => ({ id: r.id, canWrite: false, canDelete: false }))
          )
        ).then(perms => {
          const map = {};
          for (const p of perms) map[p.id] = p;
          setPermissionsById(map);
        });

        if (!preserveExpanded) {
          const roots = treeMap[ROOT_KEY] || [];
          const init = {};
          for (const root of roots) init[root.id] = true;
          setExpanded(init);
        }
      })
      .catch(e => {
        console.error('[HierarchyView] failed to load records', e);
        setTree({});
      })
      .finally(() => setLoading(false));
  }, [resolvedTypeId]);

  useEffect(() => { loadAllRecords(); }, [loadAllRecords]);

  const handleToggle = useCallback((nodeRef) => {
    setExpanded(prev => ({ ...prev, [nodeRef]: !prev[nodeRef] }));
  }, []);

  const handleExpandAll = useCallback(() => setExpanded(collectAllExpandable(tree)), [tree]);
  const handleCollapseAll = useCallback(() => setExpanded({}), []);

  const handleNodeClick = useCallback((node) => {
    if (onRowClick) onRowClick({ id: node.id });
  }, [onRowClick]);

  const sourceId = resolvedTypeRef ? `emodel/${resolvedTypeId}` : '';
  const rootNodes = tree[ROOT_KEY] || [];
  const hasAnyExpanded = Object.values(expanded).some(Boolean);

  const handleCreateRoot = useCallback(() => {
    if (!sourceId) return;
    FormManager.openFormModal({
      record: `${sourceId}@`,
      onSubmit: () => loadAllRecords(true)
    });
  }, [sourceId, loadAllRecords]);

  return (
    <div className={classNames('ecos-hierarchy-view', bodyClassName)}>
      <div ref={bodyTopForwardedRef} className="ecos-hierarchy-view__top">
        <div className="ecos-hierarchy-view__bar">
          <div className="ecos-hierarchy-view__bar-left">
            {totalCount > 0 && (
              <>
                <button
                  type="button"
                  className="ecos-hierarchy-view__bar-btn"
                  onClick={hasAnyExpanded ? handleCollapseAll : handleExpandAll}
                  title={hasAnyExpanded ? t('journals.view.hierarchy.collapse-all') : t('journals.view.hierarchy.expand-all')}
                >
                  {hasAnyExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <span className="ecos-hierarchy-view__bar-count">
                  {t('journals.view.hierarchy.total', { count: totalCount })}
                </span>
              </>
            )}
            {sourceId && canCreate && (
              <button
                type="button"
                className="ecos-hierarchy-view__bar-btn ecos-hierarchy-view__bar-btn_create"
                onClick={handleCreateRoot}
                title={t('journals.view.hierarchy.create')}
              >
                <Icon className="icon-plus" />
              </button>
            )}
          </div>
          <ViewTabs stateId={stateId} />
        </div>
      </div>
      <div className="ecos-hierarchy-view__body" style={{ maxHeight: getMaxHeight?.() }}>
        {loading && <div className="ecos-hierarchy-view__info">{t('select-hierarchical.loading')}</div>}
        {!loading && rootNodes.length === 0 && (
          <div className="ecos-hierarchy-view__info">{t('select-hierarchical.empty')}</div>
        )}
        {!loading && rootNodes.length > 0 && (
          <ul className="ecos-hierarchy-view__tree">
            {rootNodes.map(node => (
              <li
                key={node.id}
                className={classNames('ehv-parent', {
                  'ehv-parent_active': selectedRecordId && selectedRecordId.includes(node.id)
                })}
              >
                <TreeNodeRow
                  node={node}
                  tree={tree}
                  expanded={expanded}
                  selectedId={selectedRecordId}
                  sourceId={sourceId}
                  childAssocAttr={childAssocAttr}
                  canCreate={canCreate}
                  permissionsById={permissionsById}
                  onToggle={handleToggle}
                  onClick={handleNodeClick}
                  onReload={() => loadAllRecords(true)}
                  isParentLevel
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HierarchyView;
