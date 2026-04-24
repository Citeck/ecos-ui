import classNames from 'classnames';
import get from 'lodash/get';
import React, { useState, useEffect } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';

import SettingsWidget from './Settings';
import TreeNode, { type TreeNode as TreeNodeType } from './TreeNode';
import { createCategoryFormId, Labels, TREE_REFRESH_EVENT, tooltipIdCreate, tooltipIdSettings } from './constants';
import { TreeDragContext, type TreeDragContextValue } from './dragContext';
import EmptyIcon from './icons/EmptyIcon';

import { fetchBreadcrumbs, reloadGrid } from '@/actions/journals';
import FormManager from '@/components/EcosForm/FormManager';
import Records from '@/components/Records';
import RecordImpl from '@/components/Records/Record';
import { Icon, Tooltip } from '@/components/common';
import { Btn } from '@/components/common/btns';
import { BaseWidgetProps } from '@/components/widgets/BaseWidget';
import { JournalUrlParams as JUP, SourcesId } from '@/constants';
import { getStateId, wrapArgs } from '@/helpers/store';
import { getRecordRef, getSearchParams, getWorkspaceId, updateCurrentUrl } from '@/helpers/urls';
import { isMobileDevice, t, getCurrentUserName, getMLValue } from '@/helpers/util';
import { NotificationManager } from '@/services/notifications';
import { Events } from '@/services/PageService';
import { MLTextType } from '@/types/components';
import { Dispatch, RootState } from '@/types/store';
import { IJournalState, PaginationType } from '@/types/store/journals';

import '@/components/Dashlet/Dashlet.scss';
import './style.scss';

interface HierarchicalTreeWidget extends BaseWidgetProps {
  stateId: string;
  journalId?: string;
  isDraggingRow?: boolean;
  label?: MLTextType | string;
  reloadGrid: (pagination?: Partial<PaginationType>) => void;
  fetchBreadcrumbs: () => void;
  config?: BaseWidgetProps['config'] & { label: HierarchicalTreeWidget['label'] };
}

const HierarchicalTreeWidget = ({
  record: initialRecordRef,
  isSameHeight,
  reloadGrid,
  label,
  stateId,
  id,
  onSave,
  fetchBreadcrumbs,
  isDraggingRow,
  config
}: HierarchicalTreeWidget) => {
  const journalId = String(get(getSearchParams(), JUP.JOURNAL_ID, ''));
  const isJournalMode = !!journalId;
  const sourceId = isJournalMode ? SourcesId.CATEGORY : SourcesId.WIKI;
  const rootRecord = isJournalMode ? 'null' : `${SourcesId.WIKI}@${getWorkspaceId()}$ROOT`;

  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [isOpenSettings, setIsOpenSettings] = useState<boolean>(false);
  const [recordRef, setRecordRef] = useState<string | null>(
    isJournalMode ? String(get(getSearchParams(), JUP.RECORD_REF, '')) : initialRecordRef
  );
  const [records, setRecords] = useState<TreeNodeType[]>([]);
  const [draggedNode, setDraggedNode] = useState<TreeNodeType | null>(null);
  const [isRootDropActive, setIsRootDropActive] = useState<boolean>(false);
  const [isHeaderDropActive, setIsHeaderDropActive] = useState<boolean>(false);

  useEffect(() => {
    fetchRecords().then(({ records = [] }) => {
      setRecords(records);
    });

    Records.get(`${SourcesId.PERSON}@${getCurrentUserName()}`)
      .load('isAdmin?bool')
      .then((value: boolean) => {
        if (!value) {
          Records.get(`${sourceId}@${getWorkspaceId()}$ROOT`)
            .load('permissions._has.Write?bool')
            .then((value: boolean) => setCanEdit(value));
        } else {
          setCanEdit(value);
        }
      });

    document.addEventListener(Events.CHANGE_URL_LINK_EVENT, () => {
      const newRecordRef = getRecordRef();
      newRecordRef && setRecordRef(newRecordRef);
    });

    return () => {
      document.removeEventListener(Events.CHANGE_URL_LINK_EVENT, () => {});
    };
  }, []);

  const fetchRecords = (parent?: string) => {
    const dashboardQuery = {
      ecosType: 'wiki',
      query: {
        t: 'eq',
        a: '_parent',
        val: parent || rootRecord
      }
    };

    const journalQuery = {
      sourceId: SourcesId.CATEGORY,
      query: {
        t: 'eq',
        a: '_parent',
        v: parent || `${SourcesId.JOURNAL}@${journalId}`
      }
    };

    return Records.query(
      { ...(isJournalMode ? journalQuery : dashboardQuery), language: 'predicate' },
      {
        name: '_disp',
        parent: '_parent?id',
        children: 'children[]{id?localId,name:_disp,parent:_parent?id,children:children[]?id}',
        id: 'id'
      }
    );
  };

  const moveNode = async (
    sourceNodeId: string,
    targetParentNodeId: string | null,
    sourceOldParent?: string | null,
    sourceName?: string
  ) => {
    if (targetParentNodeId !== null && sourceNodeId === targetParentNodeId) {
      return;
    }

    const sourceFullId = `${sourceId}@${sourceNodeId}`;
    const targetParentFullId = targetParentNodeId === null ? rootRecord : `${sourceId}@${targetParentNodeId}`;

    if (sourceOldParent && sourceOldParent === targetParentFullId) {
      return;
    }

    // Cycle prevention: walk up from the target parent — if we encounter the dragged node
    // in the chain, the move would create a loop. Root target can never form a cycle.
    if (targetParentNodeId !== null) {
      const visited = new Set<string>();
      let current: string | null = targetParentFullId;
      while (current && current !== rootRecord && !visited.has(current)) {
        if (current === sourceFullId) {
          NotificationManager.error(t(Labels.MOVE_NODE_CYCLE));
          return;
        }
        visited.add(current);
        try {
          const parent: string | null = await Records.get(current).load('_parent?id');
          current = parent || null;
        } catch (error) {
          console.error(error);
          current = null;
        }
      }
    }

    try {
      const rec = Records.getRecordToEdit(sourceFullId);
      rec.att('_parent', targetParentFullId);
      rec.att('_parentAtt', 'children');
      await rec.save();

      const { records: newRecords = [] } = await fetchRecords();
      setRecords(newRecords);

      const affectedParents = [sourceOldParent, targetParentFullId].filter(Boolean) as string[];
      document.dispatchEvent(new CustomEvent(TREE_REFRESH_EVENT, { detail: { affectedParents } }));

      NotificationManager.success(t(Labels.MOVE_NODE_SUCCESS, { nodeName: sourceName || '' }));
    } catch (error) {
      console.error(error);
      NotificationManager.error(t(Labels.MOVE_NODE_ERROR, { nodeName: sourceName || '' }));
    }
  };

  const dragContextValue: TreeDragContextValue = {
    draggedNode,
    setDraggedNode,
    moveNode
  };

  const canDropOnRoot = !!draggedNode && draggedNode.parent !== rootRecord;

  useEffect(() => {
    if (!draggedNode) {
      setIsRootDropActive(false);
      setIsHeaderDropActive(false);
    }
  }, [draggedNode]);

  const handleRootDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canDropOnRoot) {
      return;
    }
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch (error) {
      console.error(error);
    }
    if (!isRootDropActive) {
      setIsRootDropActive(true);
    }
  };

  const handleRootDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsRootDropActive(false);
  };

  const handleRootDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsRootDropActive(false);
    if (!canDropOnRoot || !draggedNode) {
      return;
    }
    e.preventDefault();
    moveNode(draggedNode.id, null, draggedNode.parent || null, draggedNode.name);
  };

  const handleHeaderDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canDropOnRoot) {
      return;
    }
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch (error) {
      console.error(error);
    }
    if (!isHeaderDropActive) {
      setIsHeaderDropActive(true);
    }
  };

  const handleHeaderDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsHeaderDropActive(false);
  };

  const handleHeaderDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsHeaderDropActive(false);
    if (!canDropOnRoot || !draggedNode) {
      return;
    }
    e.preventDefault();
    moveNode(draggedNode.id, null, draggedNode.parent || null, draggedNode.name);
  };

  const create = async (parent?: string) => {
    FormManager.openFormModal({
      ...(isJournalMode && { formId: createCategoryFormId }),
      record: `${sourceId}@`,
      title: t(isJournalMode ? Labels.MODAL_TITLE_JOURNAL_CREATE : Labels.MODAL_TITLE_DASHBOARD_CREATE),
      attributes: {
        _parent: isJournalMode ? `${SourcesId.JOURNAL}@${journalId}` : parent || rootRecord,
        _parentAtt: 'children'
      },
      onSubmit: (record: RecordImpl) => {
        fetchRecords().then(({ records = [] }) => {
          setRecords(records);

          if (!isJournalMode && record.id) {
            updateCurrentUrl({ recordRef: record.id });
          }
        });
      }
    });
  };

  const renderTreeContent = () =>
    records.length === 0 ? (
      <div className="ecos-hierarchical-tree-widget-empty">
        <EmptyIcon />
        <p>{t(Labels.NO_DATA)}</p>
        {canEdit && <Btn onClick={() => create()}>{t(Labels.ADD)}</Btn>}
      </div>
    ) : (
      <TreeDragContext.Provider value={dragContextValue}>
        <div
          className={classNames('ecos-hierarchical-tree-widget-body', {
            draggable: isDraggingRow
          })}
        >
          <ul className="tree">
            {records.map(record => (
              <li
                key={record.id}
                className={classNames('parent-tree', {
                  'parent-tree__active': recordRef && recordRef.includes(record.id),
                  'parent-tree__no-children': record.children.length === 0
                })}
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                  event.preventDefault();
                  if (record.children.length === 0) {
                    updateCurrentUrl({ recordRef: `${sourceId}@${record.id}` });
                  }
                }}
              >
                <TreeNode
                  isDraggingRow={isDraggingRow}
                  toggleOpen={() => updateCurrentUrl({ recordRef: `${sourceId}@${record.id}` })}
                  updateRootChilds={childs => setRecords(childs)}
                  rootRecord={rootRecord}
                  recordRef={recordRef}
                  node={record}
                  onFetchChildren={fetchRecords}
                  canEdit={canEdit}
                  records={records}
                  setRecords={setRecords}
                  initialRecordRef={initialRecordRef}
                  reloadGrid={reloadGrid}
                  callbackSubmitForm={isJournalMode ? fetchBreadcrumbs : () => null}
                />
              </li>
            ))}
          </ul>
          {canDropOnRoot && (
            <div
              className={classNames('ecos-hierarchical-tree-widget-root-drop', {
                'ecos-hierarchical-tree-widget-root-drop--active': isRootDropActive
              })}
              onDragEnter={handleRootDragOver}
              onDragOver={handleRootDragOver}
              onDragLeave={handleRootDragLeave}
              onDrop={handleRootDrop}
            >
              {t(Labels.MOVE_TO_ROOT)}
            </div>
          )}
        </div>
      </TreeDragContext.Provider>
    );

  const renderContent = () =>
    isOpenSettings ? (
      <SettingsWidget
        stateId={stateId}
        onClose={() => setIsOpenSettings(false)}
        label={label || config?.label}
        id={id}
        isJournalMode={isJournalMode}
        onSave={onSave}
        config={config}
      />
    ) : (
      renderTreeContent()
    );

  const renderActions = () => (
    <div className="ecos-hierarchical-tree-widget__structure-actions">
      {!isOpenSettings && (
        <Tooltip
          uncontrolled
          text={t(isJournalMode ? Labels.ADD_CATEGORY : Labels.ADD_GROUP)}
          target={tooltipIdCreate}
          off={isMobileDevice()}
        >
          <div id={tooltipIdCreate} className="ecos-hierarchical-tree-widget__structure-actions_btn" onClick={() => create()}>
            <Icon className="icon-plus" />
          </div>
        </Tooltip>
      )}
      <Tooltip uncontrolled text={t(Labels.SETTINGS)} target={tooltipIdSettings} off={isMobileDevice()}>
        <div
          id={tooltipIdSettings}
          className={classNames('ecos-hierarchical-tree-widget__structure-actions_btn', { active: isOpenSettings })}
          onClick={() => setIsOpenSettings(!isOpenSettings)}
        >
          <Icon className="icon-settings" />
        </div>
      </Tooltip>
    </div>
  );

  return (
    <div
      className={classNames('ecos-hierarchical-tree-widget', {
        fullHeight: isSameHeight
      })}
    >
      <div
        className={classNames('ecos-hierarchical-tree-widget-header', {
          'ecos-hierarchical-tree-widget-header--root-drop-available': canDropOnRoot,
          'ecos-hierarchical-tree-widget-header--root-drop-active': isHeaderDropActive
        })}
        onDragEnter={handleHeaderDragOver}
        onDragOver={handleHeaderDragOver}
        onDragLeave={handleHeaderDragLeave}
        onDrop={handleHeaderDrop}
      >
        <div className="ecos-hierarchical-tree-widget-header-info">
          <h4
            onClick={(event: React.MouseEvent<HTMLElement>) => {
              event.preventDefault();
              updateCurrentUrl({ recordRef: rootRecord });
            }}
          >
            {isOpenSettings ? t(Labels.SETTINGS) : t(getMLValue(label || config?.label)) || t(Labels.TITLE_JOURNAL)}
          </h4>
        </div>
        {canEdit && renderActions()}
      </div>
      {isSameHeight ? (
        <Scrollbars
          className="dashlet__same-scrollbar"
          renderTrackVertical={(props: React.HTMLAttributes<HTMLDivElement>) => (
            <div {...props} className="dashlet__same-scrollbar_track" />
          )}
        >
          {renderContent()}
        </Scrollbars>
      ) : (
        renderContent()
      )}
    </div>
  );
};

const mapStateToProps = (_: RootState, props: BaseWidgetProps) => ({
  stateId: props.stateId || getStateId(props)
});

const mapDispatchToProps = (
  dispatch: Dispatch,
  props: BaseWidgetProps & { journalId: HierarchicalTreeWidget['journalId'] }
): Pick<HierarchicalTreeWidget, 'reloadGrid' | 'fetchBreadcrumbs'> => {
  const stateId = props.stateId || getStateId({ ...props, id: props.journalId });
  const w = wrapArgs(stateId);

  return {
    reloadGrid: pagination => dispatch(reloadGrid(w<Partial<IJournalState['grid']>>({ pagination }))),
    fetchBreadcrumbs: () => dispatch(fetchBreadcrumbs(w()))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(HierarchicalTreeWidget);
