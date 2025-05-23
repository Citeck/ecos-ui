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

import { Events } from '@/services/PageService';

import './style.scss';

const Labels = {
  TITLE: 'hierarchical-tree-widget.title',
  MODAL_TITLE: 'hierarchical-tree-widget.modal-title',
  ADD_GROUP: 'hierarchical-tree-widget.create'
};

const tooltipId = 'create-tree-node-button';

interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
}

const TreeNode = ({
  node,
  recordRef,
  onFetchChildren,
  canEdit
}: {
  node: TreeNode;
  recordRef: string;
  onFetchChildren: (parent: string) => Promise<{ records: TreeNode[] }>;
  canEdit: boolean;
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
          onFetchChildren(`emodel/wiki@${node.id}`).then(({ records = [] }) => {
            setChildren(records);
          });
      }
    });
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
        onClick={e => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
      >
        {node.name}
        {canEdit && (
          <div className="tree-actions">
            <div className="ecos-hierarchical-tree-widget__structure__bnt-create" onClick={() => create(`emodel/wiki@${node.id}`)}>
              <Icon className="icon-plus" />
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
            onClick={e => {
              e.stopPropagation();

              updateCurrentUrl({
                recordRef: `emodel/wiki@${child.id}`
              });
            }}
          >
            {child && <TreeNode recordRef={recordRef} node={child} onFetchChildren={onFetchChildren} canEdit={canEdit} />}
          </li>
        ))}
      </ul>
    </details>
  );
};

const HierarchicalTreeWidget = ({ record: initialRecordRef }: { record: string }) => {
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
          val: parent || `emodel/wiki@${getWorkspaceId()}$ROOT`
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
        _parent: parent || `emodel/wiki@${getWorkspaceId()}$ROOT`,
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
        <h4>{t(Labels.TITLE)}</h4>
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
                  'parent-tree__active': recordRef && recordRef.includes(record.id)
                })}
                onClick={e => {
                  e.stopPropagation();

                  updateCurrentUrl({
                    recordRef: `emodel/wiki@${record.id}`
                  });
                }}
              >
                <TreeNode recordRef={recordRef} node={record} onFetchChildren={fetchRecords} canEdit={canEdit} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default React.memo(HierarchicalTreeWidget);
