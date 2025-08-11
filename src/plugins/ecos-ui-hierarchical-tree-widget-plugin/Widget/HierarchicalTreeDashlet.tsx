import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import React, { useState, useEffect } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import ChevronDown from './icons/ChevronDown';
import ChevronRight from './icons/ChevronRight';
import EmptySvg from './icons/EmptySvg';

import FormManager from '@/components/EcosForm/FormManager';
// @ts-ignore
import Records from '@/components/Records';
import { Icon, Tooltip } from '@/components/common';
import { Btn } from '@/components/common/btns';
import { DialogManager } from '@/components/common/dialogs';
import { BaseWidgetProps } from '@/components/widgets/BaseWidget';
import { SourcesId } from '@/constants';
import { getRecordRef, getWorkspaceId, updateCurrentUrl } from '@/helpers/urls';
import { isMobileDevice, t } from '@/helpers/util';
import { Events } from '@/services/PageService';

import '@/components/Dashlet/Dashlet.scss';
import './style.scss';

const Labels = {
  ADD: 'add',
  NO_DATA: 'comp.no-data.indication',
  TITLE: 'hierarchical-tree-widget.title',
  MODAL_TITLE: 'hierarchical-tree-widget.modal-title',
  ADD_GROUP: 'hierarchical-tree-widget.create',
  CONFIRM_MODAL_DELETE_TITLE: 'record-action.delete.dialog.title.remove-one',
  CONFIRM_MODAL_DELETE_TEXT: 'record-action.delete.dialog.msg.remove-one'
};

const tooltipId = 'create-tree-node-button';

interface TreeNode {
  parent: string;
  id: string;
  name: string;
  children: TreeNode[];
}

const TreeNode = ({
  node,
  recordRef,
  rootRecord,
  records,
  onFetchChildren,
  updateRootChilds,
  canEdit,
  toggleOpen,
  setRecords
}: {
  node: TreeNode;
  recordRef: string;
  rootRecord: string;
  records: TreeNode[];
  onFetchChildren: (parent: string) => Promise<{ records: TreeNode[] }>;
  updateRootChilds: (childs: TreeNode[]) => void;
  canEdit: boolean;
  setRecords: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  toggleOpen?: () => void;
}): React.ReactElement => {
  const [isOpen, setIsOpen] = useState<boolean>(get(node, 'children.length', 0) > 1);
  const [displayName, setDisplayName] = useState<string>(node.name || t('documents-widget.untitled'));
  const [children, setChildren] = useState<TreeNode[]>(node.children || []);

  const create = (parent: string) => {
    FormManager.openFormModal({
      record: `${SourcesId.WIKI}@`,
      title: t(Labels.MODAL_TITLE),
      attributes: {
        _parent: parent || `${SourcesId.WIKI}@${node.id}`,
        _parentAtt: 'children'
      },
      onSubmit: () => {
        isFunction(onFetchChildren) &&
          onFetchChildren(node.parent).then(({ records: parentRecords = [] }) => {
            updateRootChilds(parentRecords);

            const currentNode = parentRecords.find(record => record.id === node.id);

            setChildren(currentNode?.children || []);
            setIsOpen(true);
          });
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
        const currentId = `${SourcesId.WIKI}@${node.id}`;

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
    const instanceRecord = Records.get(`${SourcesId.WIKI}@${node.id}`);

    instanceRecord &&
      instanceRecord.watch(['_disp'], (newRecord: { _disp: string }) => {
        setDisplayName(newRecord._disp);
      });
  }, []);

  useEffect(() => {
    const hasFirstChildrenName = get(children, '[0].name', '');

    if (isOpen && hasFirstChildrenName.length === 0) {
      isFunction(onFetchChildren) &&
        onFetchChildren(`${SourcesId.WIKI}@${node.id}`).then(({ records = [] }) => {
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

  return (
    <details open={isOpen}>
      <summary
        onClick={e => e.preventDefault()}
        className={classNames('tree-summary', { nochild: !children.length })}
        data-record={node.id}
      >
        {children.length > 0 && (
          <div className="tree-summary_btn" onClick={onClickChevron}>
            {isOpen ? <ChevronDown width={20} height={20} /> : <ChevronRight width={20} height={20} />}
          </div>
        )}
        <label className="tree-summary_label" onClick={onClickLabel}>
          {displayName}
        </label>
        {canEdit && (
          <div className="tree-actions">
            <div className="tree-actions__btn-create" onClick={() => create(`${SourcesId.WIKI}@${node.id}`)}>
              <Icon className="icon-plus" />
            </div>
            <div className="tree-actions__btn-delete" onClick={deleteRecord}>
              <Icon className="icon-delete" />
            </div>
          </div>
        )}
      </summary>
      <ul style={{ paddingTop: '5px', paddingLeft: '15px' }}>
        {children.map((child: TreeNode) => (
          <li
            key={child.id}
            className={classNames('child-tree', {
              'child-tree__active': recordRef && recordRef.includes(child.id),
              'child-tree__last': child.children?.length === 0
            })}
            onClick={(event: React.MouseEvent<HTMLElement>) => {
              event.stopPropagation();
              if (child.children.length === 0) {
                updateCurrentUrl({ recordRef: `${SourcesId.WIKI}@${child.id}` });
              }
            }}
          >
            {child && (
              <TreeNode
                toggleOpen={() => updateCurrentUrl({ recordRef: `${SourcesId.WIKI}@${child.id}` })}
                rootRecord={rootRecord}
                recordRef={recordRef}
                records={records}
                setRecords={setRecords}
                node={child}
                onFetchChildren={onFetchChildren}
                updateRootChilds={updateChilds}
                canEdit={canEdit}
              />
            )}
          </li>
        ))}
      </ul>
    </details>
  );
};

const HierarchicalTreeWidget = ({ record: initialRecordRef, isSameHeight }: BaseWidgetProps) => {
  const rootRecord = `${SourcesId.WIKI}@${getWorkspaceId()}$ROOT`;

  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [recordRef, setRecordRef] = useState<string>(initialRecordRef);
  const [records, setRecords] = useState<TreeNode[]>([]);

  useEffect(() => {
    fetchRecords().then(({ records = [] }) => {
      setRecords(records);
    });
    // @ts-ignore
    Records.get(`${SourcesId.WIKI}@${getWorkspaceId()}$ROOT`)
      .load('permissions._has.Write?bool')
      .then((value: boolean) => setCanEdit(value));

    document.addEventListener(Events.CHANGE_URL_LINK_EVENT, () => {
      const newRecordRef = getRecordRef();
      newRecordRef && setRecordRef(newRecordRef);
    });

    return () => {
      document.removeEventListener(Events.CHANGE_URL_LINK_EVENT, () => {});
    };
  }, []);

  const fetchRecords = (parent?: string) => {
    // @ts-ignore
    return Records.query(
      {
        language: 'predicate',
        ecosType: 'wiki',
        query: {
          t: 'eq',
          a: '_parent',
          val: parent || rootRecord
        }
      },
      {
        name: '_disp',
        parent: '_parent?id',
        children: 'children[]{id?localId,name:_disp,parent:_parent?id,children:children[]?id}',
        id: 'id'
      }
    );
  };

  const create = async (parent?: string) => {
    FormManager.openFormModal({
      record: `${SourcesId.WIKI}@`,
      title: t(Labels.MODAL_TITLE),
      attributes: {
        _parent: parent || rootRecord,
        _parentAtt: 'children'
      },
      onSubmit: () => {
        fetchRecords().then(({ records = [] }) => {
          setRecords(records);
        });
      }
    });
  };

  const renderContent = () =>
    records.length === 0 ? (
      <div className="ecos-hierarchical-tree-widget-empty">
        <EmptySvg />
        <p>{t(Labels.NO_DATA)}</p>
        {canEdit && <Btn onClick={() => create()}>{t(Labels.ADD)}</Btn>}
      </div>
    ) : (
      <div className="ecos-hierarchical-tree-widget-body">
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
                  updateCurrentUrl({ recordRef: `${SourcesId.WIKI}@${record.id}` });
                }
              }}
            >
              <TreeNode
                toggleOpen={() => updateCurrentUrl({ recordRef: `${SourcesId.WIKI}@${record.id}` })}
                updateRootChilds={childs => setRecords(childs)}
                rootRecord={rootRecord}
                recordRef={recordRef}
                node={record}
                onFetchChildren={fetchRecords}
                canEdit={canEdit}
                records={records}
                setRecords={setRecords}
              />
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div
      className={classNames('ecos-hierarchical-tree-widget', {
        fullHeight: isSameHeight
      })}
    >
      <div className="ecos-hierarchical-tree-widget-header">
        <h4
          onClick={(event: React.MouseEvent<HTMLElement>) => {
            event.preventDefault();
            updateCurrentUrl({ recordRef: rootRecord });
          }}
        >
          {t(Labels.TITLE)}
        </h4>
        {canEdit && (
          <Tooltip uncontrolled text={t(Labels.ADD_GROUP)} target={tooltipId} off={isMobileDevice()}>
            <div id={tooltipId} className="ecos-hierarchical-tree-widget__structure__bnt-create" onClick={() => create()}>
              <Icon className="icon-plus" />
            </div>
          </Tooltip>
        )}
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

export default HierarchicalTreeWidget;
