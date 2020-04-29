import React from 'react';
import { Tree } from '../../components/common';
import { uniqueId } from 'lodash';

const actions = [
  {
    type: 'DELETE',
    icon: 'icon-delete',
    className: 'ecos-menu-settings-editor-items__action_caution',
    onClick: () => null
  }
];

const items = Array(3).fill({
  id: uniqueId('menu-'),
  name: 'test',
  icon: { value: 'icon' },
  selected: true,
  editable: true,
  removable: true,
  draggable: true,
  expandable: true,
  actionConfig: actions,
  items: [
    {
      id: uniqueId('submenu-'),
      name: 'child',
      selected: true,
      editable: true,
      removable: true,
      draggable: true,
      items: [],
      actionConfig: actions
    },
    {
      id: uniqueId('submenu-'),
      name: 'child',
      items: []
    }
  ]
});

const createOptions = [
  {
    id: '1111',
    forbiddenTypes: [],
    label: 'Договоры'
  },
  {
    id: '22222',
    forbiddenTypes: [],
    label: 'Журналы'
  }
];

export default class extends React.Component {
  render() {
    return (
      <div style={{ width: '50%', height: '70%', background: 'antiquewhite', padding: '10px', overflow: 'auto' }}>
        <Tree
          data={items}
          classNameItem="ecos-menu-settings-editor-items__tree-item"
          openAll
          draggable
          dragLvlTo={1}
          onClickActionItem={console.log}
        />
      </div>
    );
  }
}
