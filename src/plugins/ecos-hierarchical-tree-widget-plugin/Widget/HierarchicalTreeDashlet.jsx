import React, { useState, useEffect } from 'react';
import isFunction from 'lodash/isFunction';
import get from 'lodash/get';

import FormManager from '../../../components/EcosForm/FormManager';
import Records from '../../../components/Records';
import { Icon, Tooltip } from '../../../components/common';
import { Btn } from '../../../components/common/btns';
import { getWorkspaceId } from '../../../helpers/urls';
import { isMobileDevice, t } from '../../../helpers/util';

import './style.scss';

const Labels = {
  TITLE: 'hierarchical-tree-widget-title',
  ADD_GROUP: 'hierarchical-tree-widget-create'
};

const tooltipId = 'create-tree-node-button';

const TreeNode = ({ node, onFetchChildren }) => {
  const [isOpen, setIsOpen] = useState(get(node, 'children.length', 0));
  const [children, setChildren] = useState(node.children || []);

  const create = parent => {
    FormManager.openFormModal({
      record: 'emodel/wiki@',
      title: t(Labels.TITLE),
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

  useEffect(
    () => {
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
    },
    [isOpen]
  );

  return (
    <details open={isOpen}>
      <summary
        onClick={e => {
          e.preventDefault();

          setIsOpen(!isOpen);
        }}
      >
        {node.name}
      </summary>
      <ul style={{ paddingTop: '5px', paddingLeft: '15px' }}>
        {children.map(child => (
          <li
            key={child.id}
            className="child-tree"
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set('recordRef', `emodel/wiki@${child.id}`);
              const newUrl = window.location.origin + window.location.pathname + '?' + params.toString();
              window.history.pushState({ path: newUrl }, '', newUrl);
            }}
          >
            <TreeNode node={child} onFetchChildren={onFetchChildren} />
            <div className="tree-actions">
              <div className="ecos-hierarchical-tree-widget__structure__bnt-create" onClick={() => create(`emodel/wiki@${child.id}`)}>
                <Icon className="icon-plus" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
};

const HierarchicalTreeWidget = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchRecords().then(({ records = [] }) => {
      setRecords(records);
    });
  }, []);

  const fetchRecords = parent => {
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

  const create = async parent => {
    FormManager.openFormModal({
      record: 'emodel/wiki@',
      title: t(Labels.TITLE),
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
        <h4>База знаний</h4>
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
              stroke-width="2"
            />
            <path d="M21 45.6171V122.617H39" stroke="#EEF0F8" stroke-width="3" stroke-linecap="square" stroke-linejoin="round" />
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
              stroke-width="6"
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
              stroke-width="6"
              mask="url(#path-4-inside-2_4673_76086)"
            />
            <path d="M21.2432 93H38.7432" stroke="#EEF0F8" stroke-width="3" stroke-linecap="square" stroke-linejoin="round" />
            <path d="M21.2432 63H38.7432" stroke="#EEF0F8" stroke-width="3" stroke-linecap="square" stroke-linejoin="round" />
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
              stroke-width="6"
              mask="url(#path-7-inside-3_4673_76086)"
            />
            <path d="M21.2432 63H38.7432" stroke="#EEF0F8" stroke-width="3" stroke-linecap="square" stroke-linejoin="round" />
            <path d="M66.2432 63H129.243" stroke="#EEF0F8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M41.2432 39H104.243" stroke="#EEF0F8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M66.2432 93H129.243" stroke="#EEF0F8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M66.2432 123.617H129.243" stroke="#EEF0F8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
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
              stroke-width="6"
              mask="url(#path-13-inside-4_4673_76086)"
            />
            <ellipse cx="14.1813" cy="9.06449" rx="1.93816" ry="2.06449" fill="white" />
            <ellipse cx="20.1716" cy="9.06461" rx="1.93816" ry="2.06449" fill="white" />
            <ellipse cx="26.1628" cy="9.06455" rx="1.93816" ry="2.06449" fill="white" />
            <path
              d="M1 8.61706C1 5.30336 3.68629 2.61707 7 2.61707L144 2.61707C147.314 2.61707 150 5.30336 150 8.61706V23.6171L1 23.6171L1 8.61706Z"
              stroke="#EEF0F8"
              stroke-width="2"
            />
          </svg>
          <p>Нет элементов</p>
          <Btn onClick={() => create()}>Добавить элемент</Btn>
        </div>
      ) : (
        <div className="ecos-hierarchical-tree-widget-body">
          <ul className="tree">
            {records.map(record => (
              <li
                className="parent-tree"
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set('recordRef', `emodel/wiki@${record.id}`);
                  const newUrl = window.location.origin + window.location.pathname + '?' + params.toString();
                  window.history.pushState({ path: newUrl }, '', newUrl);
                }}
              >
                <TreeNode key={record.id} node={record} onFetchChildren={fetchRecords} />
                <div className="tree-actions">
                  <div className="ecos-hierarchical-tree-widget__structure__bnt-create" onClick={() => create(`emodel/wiki@${record.id}`)}>
                    <Icon className="icon-plus" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HierarchicalTreeWidget;
