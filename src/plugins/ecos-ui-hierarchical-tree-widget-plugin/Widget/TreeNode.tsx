import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import React, { useContext, useEffect, useRef, useState } from 'react';

import { Labels, TREE_NODE_DRAG_MIME, TREE_REFRESH_EVENT, createCategoryFormId } from './constants';
import { TreeDragContext } from './dragContext';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { sortNodesByName } from './sortUtils';

import FormManager from '@/components/EcosForm/FormManager';
import Records from '@/components/Records';
import RecordImpl from '@/components/Records/Record';
import { Icon, Tooltip } from '@/components/common';
import { DialogManager } from '@/components/common/dialogs';
import { JournalUrlParams as JUP, SourcesId } from '@/constants';
import { t } from '@/helpers/export/util';
import { getSearchParams, updateCurrentUrl } from '@/helpers/urls';
import { isMobileDevice } from '@/helpers/util';
import { NotificationManager } from '@/services/notifications';

import './style.scss';

export interface TreeNode {
  parent: string;
  id: string;
  name: string;
  children: TreeNode[] | string[];
}

const TreeNode = ({
  node,
  recordRef,
  rootRecord,
  records,
  onFetchChildren,
  updateRootChilds,
  initialRecordRef,
  canEdit,
  isDraggingRow,
  toggleOpen,
  setRecords,
  callbackSubmitForm,
  reloadGrid
}: {
  node: TreeNode;
  recordRef: string | null;
  rootRecord: string;
  isDraggingRow?: boolean;
  initialRecordRef?: string;
  records: TreeNode[];
  onFetchChildren: (parent: string) => Promise<{ records: TreeNode[] }>;
  updateRootChilds: (childs: TreeNode[]) => void;
  canEdit: boolean;
  setRecords: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  toggleOpen?: () => void;
  callbackSubmitForm?: () => void;
  reloadGrid?: () => void;
}): React.ReactElement => {
  const [isOpen, setIsOpen] = useState<boolean>(get(node, 'children.length', 0) > 1);
  const [displayName, setDisplayName] = useState<string>(node.name || t('documents-widget.untitled'));
  const [children, setChildren] = useState<TreeNode['children']>(sortNodesByName(node.children || []));

  const [isHoverDragging, setIsHoverDragging] = useState<boolean>(false);
  const dragCounter = useRef(0);
  const dragCtx = useContext(TreeDragContext);

  const journalId = String(get(getSearchParams(), JUP.JOURNAL_ID, ''));
  const isJournalMode = !!journalId;
  const sourceId = isJournalMode ? SourcesId.CATEGORY : SourcesId.WIKI;

  const isInternalDragSource = dragCtx?.draggedNode?.id === node.id;
  const isInternalDragActive = !!dragCtx?.draggedNode;

  const isDescendantOrSelf = (rootNode: TreeNode, targetId: string): boolean => {
    if (rootNode.id === targetId) {
      return true;
    }
    if (!Array.isArray(rootNode.children)) {
      return false;
    }
    for (const child of rootNode.children) {
      if (isString(child)) {
        if (child.includes(targetId)) {
          return true;
        }
        continue;
      }
      if (isDescendantOrSelf(child, targetId)) {
        return true;
      }
    }
    return false;
  };

  const canAcceptInternalDrop = (): boolean => {
    if (!dragCtx?.draggedNode) {
      return false;
    }
    return !isDescendantOrSelf(dragCtx.draggedNode, node.id);
  };

  const create = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    FormManager.openFormModal({
      ...(isJournalMode && { formId: createCategoryFormId }),
      record: `${sourceId}@`,
      title: t(isJournalMode ? Labels.MODAL_TITLE_JOURNAL_CREATE : Labels.MODAL_TITLE_DASHBOARD_CREATE),
      attributes: {
        _parent: `${sourceId}@${node.id}`,
        _parentAtt: 'children'
      },
      onSubmit: onSubmitForm
    });
  };

  const edit = (e: React.MouseEvent<HTMLDivElement>) => {
    e && e.stopPropagation();

    const record = `${sourceId}@${node.id}`;

    FormManager.openFormModal({
      ...(isJournalMode && { formId: createCategoryFormId }),
      record,
      title: t(isJournalMode ? Labels.MODAL_TITLE_JOURNAL_EDIT : Labels.MODAL_TITLE_DASHBOARD_EDIT),
      attributes: {
        _parent: node.parent,
        _parentAtt: 'children'
      },
      onSubmit: onSubmitForm
    });
  };

  const onSubmitForm = (record: RecordImpl) => {
    isFunction(onFetchChildren) &&
      onFetchChildren(node.parent).then(({ records: parentRecords = [] }) => {
        updateRootChilds(parentRecords);

        const currentNode = parentRecords.find(record => record.id === node.id);

        setChildren(sortNodesByName(currentNode?.children || []));
        setIsOpen(true);

        callbackSubmitForm && callbackSubmitForm();

        if (!isJournalMode && record.id) {
          updateCurrentUrl({ recordRef: record.id });
        }
      });
  };

  const deleteRecord = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    // @ts-ignore
    DialogManager.confirmDialog({
      title: t(Labels.CONFIRM_MODAL_DELETE_TITLE),
      text: t(Labels.CONFIRM_MODAL_DELETE_TEXT),
      onYes: () => {
        const currentId = `${sourceId}@${node.id}`;

        return Records.remove([currentId]).then(() => {
          if (currentId === recordRef) {
            updateCurrentUrl({ recordRef: rootRecord });
          }
          onFetchChildren(node.parent).then(({ records: parentRecords = [] }) => {
            updateRootChilds(parentRecords);
          });
        });
      }
    });
  };

  const updateChilds = (childs: TreeNode[]) => {
    setChildren(sortNodesByName(childs));
  };

  useEffect(() => {
    const instanceRecord = Records.get(`${sourceId}@${node.id}`);

    instanceRecord &&
      instanceRecord.watch<{ _disp: string }>(['_disp'], newRecord => {
        setDisplayName(newRecord._disp);
      });
  }, []);

  useEffect(() => {
    const hasFirstChildrenName = get(children, '[0].name', '');

    if (isOpen && hasFirstChildrenName.length === 0) {
      isFunction(onFetchChildren) &&
        onFetchChildren(`${sourceId}@${node.id}`).then(({ records = [] }) => {
          setChildren(sortNodesByName(records));

          if (records.length > 0) {
            setIsOpen(true);
          }
        });
    }
  }, [isOpen]);

  const handleDragStart = (e: React.DragEvent<HTMLElement>) => {
    if (!canEdit || isDraggingRow) {
      return;
    }
    e.stopPropagation();
    try {
      e.dataTransfer.setData(TREE_NODE_DRAG_MIME, node.id);
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'move';
    } catch (error) {
      console.error(error);
    }
    dragCtx?.setDraggedNode(node);
  };

  const handleDragEnd = () => {
    dragCtx?.setDraggedNode(null);
    dragCounter.current = 0;
    setIsHoverDragging(false);
  };

  const handleDragEnter = () => {
    if (isDraggingRow) {
      dragCounter.current += 1;
      if (dragCounter.current > 0) {
        setIsHoverDragging(true);
      }
      return;
    }

    if (isInternalDragActive) {
      if (!canAcceptInternalDrop()) {
        return;
      }
      dragCounter.current += 1;
      if (dragCounter.current > 0) {
        setIsHoverDragging(true);
      }
    }
  };

  const handleDragLeave = () => {
    if (!isDraggingRow && !isInternalDragActive) {
      return;
    }

    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsHoverDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isDraggingRow) {
      e.preventDefault();
      try {
        e.dataTransfer!.dropEffect = 'move';
      } catch (error) {
        console.error(error);
      }
      return;
    }

    if (isInternalDragActive && canAcceptInternalDrop()) {
      e.preventDefault();
      try {
        e.dataTransfer!.dropEffect = 'move';
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter.current = 0;
    setIsHoverDragging(false);

    const internalSourceId = e.dataTransfer && e.dataTransfer.getData && e.dataTransfer.getData(TREE_NODE_DRAG_MIME);
    if (internalSourceId) {
      if (internalSourceId === node.id) {
        return;
      }
      if (dragCtx?.draggedNode && isDescendantOrSelf(dragCtx.draggedNode, node.id)) {
        return;
      }
      dragCtx?.moveNode(internalSourceId, node.id, dragCtx.draggedNode?.parent || null, dragCtx.draggedNode?.name);
      return;
    }

    if (!isDraggingRow) {
      return;
    }

    const recordRef = e.dataTransfer && e.dataTransfer.getData && e.dataTransfer.getData('text/plain');
    if (recordRef) {
      addRecordToCategory(undefined, recordRef);
    }
  };

  useEffect(() => {
    const onGlobalDragEnd = () => {
      dragCounter.current = 0;
      setIsHoverDragging(false);
    };

    window.addEventListener('dragend', onGlobalDragEnd);
    return () => {
      window.removeEventListener('dragend', onGlobalDragEnd);
    };
  }, []);

  useEffect(() => {
    const onTreeRefresh = (event: Event) => {
      const detail = (event as CustomEvent<{ affectedParents?: string[] }>).detail;
      const affected = detail?.affectedParents || [];
      const myFullId = `${sourceId}@${node.id}`;
      if (!affected.includes(myFullId)) {
        return;
      }
      if (!isFunction(onFetchChildren)) {
        return;
      }
      onFetchChildren(myFullId).then(({ records: refreshed = [] }) => {
        setChildren(sortNodesByName(refreshed));
      });
    };

    document.addEventListener(TREE_REFRESH_EVENT, onTreeRefresh);
    return () => {
      document.removeEventListener(TREE_REFRESH_EVENT, onTreeRefresh);
    };
  }, [node.id, sourceId, onFetchChildren]);

  const onClickChevron = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const onClickPoint = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    toggleOpen && toggleOpen();
  };

  const addRecordToCategory = (e?: React.MouseEvent<HTMLDivElement>, recordRef?: string) => {
    e?.stopPropagation();

    if (recordRef) {
      const rec = Records.getRecordToEdit(recordRef);
      rec.att('has-category:category', `${sourceId}@${node.id}`);
      rec
        .save()
        .then(() => {
          isFunction(reloadGrid) && reloadGrid();
          NotificationManager.success(t(Labels.CARD_TO_CATEGORY_SUCCESS, { categoryName: node.name }));
        })
        .catch((error: string) => {
          NotificationManager.error(t(Labels.CARD_TO_CATEGORY_ERROR, { categoryName: node.name }));
          console.error(error);
        });
    }
  };

  const filteredChildren = children.filter(child => (isString(child) ? child.includes(sourceId) : !!child.id && !isUndefined(child.name)));

  const renderActions = () => {
    if (!canEdit) {
      return null;
    }

    const foundChild = children.find(child => isString(child) && child === initialRecordRef);
    const isViewSwapCategoryIcon = isJournalMode && initialRecordRef && !foundChild;
    const swapCategoryTargetId = `swap-category-id-${node.id}`;

    return (
      <div className="tree-actions">
        <div className="tree-actions_btn" onClick={edit}>
          <Icon className="icon-edit" />
        </div>
        <div className="tree-actions_btn" onClick={create}>
          <Icon className="icon-plus" />
        </div>
        <div className="tree-actions_btn" onClick={deleteRecord}>
          <Icon className="icon-delete" />
        </div>
        {isViewSwapCategoryIcon && (
          <Tooltip
            uncontrolled
            target={swapCategoryTargetId}
            text={t(Labels.CARD_TO_CATEGORY_TOOLTIP, { categoryName: node.name })}
            off={isMobileDevice()}
          >
            <div id={swapCategoryTargetId} className="tree-actions__btn" onClick={e => addRecordToCategory(e, initialRecordRef)}>
              <Icon className="icon-arrow" />
            </div>
          </Tooltip>
        )}
      </div>
    );
  };

  const isDraggable = canEdit && !isDraggingRow;

  return (
    <details open={isOpen}>
      <summary
        onClick={onClickPoint}
        onClickCapture={e => e.preventDefault()}
        draggable={isDraggable}
        onDragStart={isDraggable ? handleDragStart : undefined}
        onDragEnd={isDraggable ? handleDragEnd : undefined}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={classNames('tree-summary', {
          active: recordRef?.includes(node.id),
          hoverDragging: isHoverDragging,
          'tree-summary--dragging': isInternalDragSource,
          'tree-summary--draggable': isDraggable
        })}
        data-record={node.id}
      >
        {filteredChildren.length > 0 ? (
          <div className="tree-summary_btn" onClick={onClickChevron}>
            {isOpen ? <ChevronDownIcon width={16} height={16} /> : <ChevronRightIcon width={16} height={16} />}
          </div>
        ) : (
          <div className="tree-summary_btn tree-summary_btn--empty" aria-hidden="true" />
        )}
        <label className="tree-summary_label">{displayName}</label>
        {renderActions()}
      </summary>
      <ul className="tree-summary_ul">
        {children.map(
          child =>
            !isString(child) && (
              <li
                key={child.id}
                className={classNames('child-tree', {
                  'child-tree__active': recordRef && recordRef.includes(child.id),
                  'child-tree__last': child.children?.length === 0
                })}
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                  event.stopPropagation();
                  if (child.children.length === 0) {
                    updateCurrentUrl({ recordRef: `${sourceId}@${child.id}` });
                  }
                }}
              >
                {child && (
                  <TreeNode
                    isDraggingRow={isDraggingRow}
                    toggleOpen={() => updateCurrentUrl({ recordRef: `${sourceId}@${child.id}` })}
                    rootRecord={rootRecord}
                    recordRef={recordRef}
                    records={records}
                    setRecords={setRecords}
                    node={child}
                    onFetchChildren={onFetchChildren}
                    updateRootChilds={updateChilds}
                    canEdit={canEdit}
                    initialRecordRef={initialRecordRef}
                    reloadGrid={reloadGrid}
                    callbackSubmitForm={callbackSubmitForm}
                  />
                )}
              </li>
            )
        )}
      </ul>
    </details>
  );
};

export default TreeNode;
