import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import React, { useEffect, useState } from 'react';

import { Labels, createCategoryFormId } from './constants';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

import FormManager from '@/components/EcosForm/FormManager';
//@ts-ignore
import Records from '@/components/Records';
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
  toggleOpen,
  setRecords,
  callbackSubmitForm,
  reloadGrid
}: {
  node: TreeNode;
  recordRef: string | null;
  rootRecord: string;
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
  const [children, setChildren] = useState<TreeNode['children']>(node.children || []);

  const journalId = String(get(getSearchParams(), JUP.JOURNAL_ID, ''));
  const isJournalMode = !!journalId;
  const sourceId = isJournalMode ? SourcesId.CATEGORY : SourcesId.WIKI;

  const create = (parent: string) => {
    FormManager.openFormModal({
      ...(isJournalMode && { formId: createCategoryFormId }),
      record: `${sourceId}@`,
      title: t(isJournalMode ? Labels.MODAL_TITLE_JOURNAL_CREATE : Labels.MODAL_TITLE_DASHBOARD_CREATE),
      attributes: {
        _parent: parent || `${sourceId}@${node.id}`,
        _parentAtt: 'children'
      },
      onSubmit: onSubmitForm
    });
  };

  const edit = () => {
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

  const onSubmitForm = () => {
    isFunction(onFetchChildren) &&
      onFetchChildren(node.parent).then(({ records: parentRecords = [] }) => {
        updateRootChilds(parentRecords);

        const currentNode = parentRecords.find(record => record.id === node.id);

        setChildren(currentNode?.children || []);
        setIsOpen(true);

        callbackSubmitForm && callbackSubmitForm();
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

        // @ts-ignore
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
    setChildren(childs);
  };

  useEffect(() => {
    // @ts-ignore
    const instanceRecord = Records.get(`${sourceId}@${node.id}`);

    instanceRecord &&
      instanceRecord.watch(['_disp'], (newRecord: { _disp: string }) => {
        setDisplayName(newRecord._disp);
      });
  }, []);

  useEffect(() => {
    const hasFirstChildrenName = get(children, '[0].name', '');

    if (isOpen && hasFirstChildrenName.length === 0) {
      isFunction(onFetchChildren) &&
        onFetchChildren(`${sourceId}@${node.id}`).then(({ records = [] }) => {
          setChildren(records);

          if (records.length > 0) {
            setIsOpen(true);
          }
        });
    }
  }, [isOpen]);

  const onClickChevron = () => {
    setIsOpen(!isOpen);
  };

  const onClickLabel = () => {
    toggleOpen && toggleOpen();
  };

  const addRecordToCategory = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    //@ts-ignore
    const rec = Records.getRecordToEdit(initialRecordRef);
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
        {isViewSwapCategoryIcon ? (
          <Tooltip
            uncontrolled
            target={swapCategoryTargetId}
            text={t(Labels.CARD_TO_CATEGORY_TOOLTIP, { categoryName: node.name })}
            off={isMobileDevice()}
          >
            <div id={swapCategoryTargetId} className="tree-actions__btn-create" onClick={addRecordToCategory}>
              <Icon className="icon-arrow" />
            </div>
          </Tooltip>
        ) : (
          <>
            <div className="tree-actions_btn" onClick={edit}>
              <Icon className="icon-edit" />
            </div>
            <div className="tree-actions_btn" onClick={() => create(`${sourceId}@${node.id}`)}>
              <Icon className="icon-plus" />
            </div>
            <div className="tree-actions_btn" onClick={deleteRecord}>
              <Icon className="icon-delete" />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <details open={isOpen}>
      <summary
        onClick={e => e.preventDefault()}
        className={classNames('tree-summary', { active: recordRef?.includes(node.id) })}
        data-record={node.id}
      >
        {filteredChildren.length > 0 && (
          <div className="tree-summary_btn" onClick={onClickChevron}>
            {isOpen ? <ChevronDownIcon width={14} height={14} /> : <ChevronRightIcon width={14} height={14} />}
          </div>
        )}
        <label className="tree-summary_label" onClick={onClickLabel}>
          {displayName}
        </label>
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
