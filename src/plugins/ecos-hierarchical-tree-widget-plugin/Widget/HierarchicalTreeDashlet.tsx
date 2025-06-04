import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import React, { useState, useEffect } from 'react';

import FormManager from '../../../components/EcosForm/FormManager';
// @ts-ignore
import Records from '../../../components/Records';
import { Icon, Tooltip } from '../../../components/common';
import { Btn } from '../../../components/common/btns';
import { getRecordRef, getWorkspaceId, updateCurrentUrl } from '../../../helpers/urls';
import { isMobileDevice, t } from '../../../helpers/util';

import { DialogManager } from '@/components/common/dialogs';
import { Events } from '@/services/PageService';

import './style.scss';

const Labels = {
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
}): React.ReactElement => {
  const [isOpen, setIsOpen] = useState<boolean>(get(node, 'children.length', 0) > 1);
  const [children, setChildren] = useState(node.children || []);

  const create = (parent: string) => {
    FormManager.openFormModal({
      record: 'emodel/wiki@',
      title: t(Labels.MODAL_TITLE),
      attributes: {
        _parent: parent || `emodel/wiki@${node.id}`,
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
        const currentId = `emodel/wiki@${node.id}`;

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
    const hasFirstChildrenName = get(children, '[0].name', '');

    if (isOpen && hasFirstChildrenName.length === 0) {
      isFunction(onFetchChildren) &&
        onFetchChildren(`emodel/wiki@${node.id}`).then(({ records = [] }) => {
          setChildren(records);

          if (records.length > 0) {
            setIsOpen(true);
          }
        });
    }
  }, [isOpen]);

  return (
    <details open={isOpen}>
      <summary
        data-record={node.id}
        onClick={(event: React.MouseEvent<HTMLElement>) => {
          event.preventDefault();
          setIsOpen(!isOpen);
        }}
      >
        {node.name}
        {canEdit && (
          <div className="tree-actions">
            <div className="tree-actions__btn-create" onClick={() => create(`emodel/wiki@${node.id}`)}>
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
              updateCurrentUrl({ recordRef: `emodel/wiki@${child.id}` });
            }}
          >
            {child && (
              <TreeNode
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

const HierarchicalTreeWidget = ({ record: initialRecordRef }: { record: string }) => {
  const rootRecord = `emodel/wiki@${getWorkspaceId()}$ROOT`;

  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [recordRef, setRecordRef] = useState<string>(initialRecordRef);
  const [records, setRecords] = useState<TreeNode[]>([]);

  useEffect(() => {
    fetchRecords().then(({ records = [] }) => {
      setRecords(records);
    });
    // @ts-ignore
    Records.get(`emodel/wiki@${getWorkspaceId()}$ROOT`)
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
      record: 'emodel/wiki@',
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

  return (
    <div className="ecos-hierarchical-tree-widget">
      <div className="ecos-hierarchical-tree-widget-header">
        <h4
          onClick={(event: React.MouseEvent<HTMLElement>) => {
            event.preventDefault();
            updateCurrentUrl({ recordRef: rootRecord });
          }}
        >
          {t(Labels.TITLE)}
        </h4>
        <Tooltip uncontrolled text={t(Labels.ADD_GROUP)} target={tooltipId} off={isMobileDevice()}>
          <div id={tooltipId} className="ecos-hierarchical-tree-widget__structure__bnt-create" onClick={() => create()}>
            <Icon className="icon-plus" />
          </div>
        </Tooltip>
      </div>
      <hr />
      {records.length === 0 ? (
        <div className="ecos-hierarchical-tree-widget-empty">
          <svg width="152" height="182" viewBox="0 0 152 182" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1 23.6171H150V144.617C150 147.931 147.314 150.617 144 150.617H7C3.68629 150.617 1 147.931 1 144.617V23.6171Z"
              fill="white"
              stroke="#EEF0F8"
              strokeWidth="2"
            />
            <path d="M21 45.6171V122.617H39" stroke="#EEF0F8" strokeWidth="3" strokeLinecap="square" strokeLinejoin="round" />
            <mask id="path-3-inside-1_4673_76086" fill="white">
              <rect x="39.2432" y="116.617" width="14" height="14" rx="2.33333" />
            </mask>
            <rect
              x="39.2432"
              y="116.617"
              width="14"
              height="14"
              rx="2.33333"
              stroke="#EEF0F8"
              strokeWidth="6"
              mask="url(#path-3-inside-1_4673_76086)"
            />
            <mask id="path-4-inside-2_4673_76086" fill="white">
              <rect x="39.2432" y="86" width="14" height="14" rx="2.33333" />
            </mask>
            <rect
              x="39.2432"
              y="86"
              width="14"
              height="14"
              rx="2.33333"
              stroke="#EEF0F8"
              strokeWidth="6"
              mask="url(#path-4-inside-2_4673_76086)"
            />
            <path d="M21.2432 93H38.7432" stroke="#EEF0F8" strokeWidth="3" strokeLinecap="square" strokeLinejoin="round" />
            <path d="M21.2432 63H38.7432" stroke="#EEF0F8" strokeWidth="3" strokeLinecap="square" strokeLinejoin="round" />
            <mask id="path-7-inside-3_4673_76086" fill="white">
              <rect x="39.2432" y="56" width="14" height="14" rx="2.33333" />
            </mask>
            <rect
              x="39.2432"
              y="56"
              width="14"
              height="14"
              rx="2.33333"
              stroke="#EEF0F8"
              strokeWidth="6"
              mask="url(#path-7-inside-3_4673_76086)"
            />
            <path d="M21.2432 63H38.7432" stroke="#EEF0F8" strokeWidth="3" strokeLinecap="square" strokeLinejoin="round" />
            <path d="M66.2432 63H129.243" stroke="#EEF0F8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M41.2432 39H104.243" stroke="#EEF0F8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M66.2432 93H129.243" stroke="#EEF0F8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M66.2432 123.617H129.243" stroke="#EEF0F8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <mask id="path-13-inside-4_4673_76086" fill="white">
              <rect x="14.2432" y="32" width="14" height="14" rx="2.33333" />
            </mask>
            <rect
              x="14.2432"
              y="32"
              width="14"
              height="14"
              rx="2.33333"
              stroke="#EEF0F8"
              strokeWidth="6"
              mask="url(#path-13-inside-4_4673_76086)"
            />
            <ellipse cx="14.1813" cy="9.06449" rx="1.93816" ry="2.06449" fill="white" />
            <ellipse cx="20.1716" cy="9.06461" rx="1.93816" ry="2.06449" fill="white" />
            <ellipse cx="26.1628" cy="9.06455" rx="1.93816" ry="2.06449" fill="white" />
            <path
              d="M1 8.61706C1 5.30336 3.68629 2.61707 7 2.61707L144 2.61707C147.314 2.61707 150 5.30336 150 8.61706V23.6171L1 23.6171L1 8.61706Z"
              stroke="#EEF0F8"
              strokeWidth="2"
            />
          </svg>
          <p>{t('comp.no-data.indication')}</p>
          {canEdit && <Btn onClick={() => create()}>{t('add')}</Btn>}
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
                  updateCurrentUrl({ recordRef: `emodel/wiki@${record.id}` });
                }}
              >
                <TreeNode
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
      )}
    </div>
  );
};

export default HierarchicalTreeWidget;
