import React from 'react';
import { Tree } from '../../components/common';
import { deepClone } from '../../helpers/util';
import { moveItemAfterByKey } from '../../helpers/arrayOfObjects';
import { toGeneratorTree } from '../../helpers/dataGenerators';

const _actions = [
  {
    type: 'EDIT',
    icon: 'icon-edit',
    whenSelected: true
  },
  {
    type: 'DELETE',
    icon: 'icon-delete',
    whenSelected: true
  },
  {
    type: 'ACTIVE',
    icon: 'icon-on',
    whenSelected: true
  },
  {
    type: 'NO_ACTIVE',
    icon: 'icon-off'
  }
];

const _items = toGeneratorTree(3, 1);

const _createOptions = [
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

function findItem(items, id) {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }

    const sub = item.items && findItem(item.items, id);

    if (sub) {
      return sub;
    }
  }
}

function setActions(items) {
  for (const item of items) {
    item.actionConfig = item.allActions ? item.allActions.filter(act => !!act.whenSelected === item.selected) : [];
    item.items && setActions(item.items);
  }

  return items;
}

export default class extends React.Component {
  state = {
    items: setActions(_items)
  };

  onClickActionItem = ({ action, id }) => {
    const items = deepClone(this.state.items);
    const foundItem = findItem(items, id);

    switch (action) {
      case 'ACTIVE':
      case 'NO_ACTIVE':
        foundItem.selected = !foundItem.selected;
        foundItem.actionConfig = foundItem.allActions.filter(act => !!act.whenSelected === foundItem.selected);
        break;
    }

    this.setState({ items });
  };

  moveItemTo = (fromId, toId) => {
    const items = moveItemAfterByKey({ fromId, toId, original: this.state.items, key: 'dndIdx' });
    this.setState({ items });
  };

  render() {
    const { items } = this.state;

    return (
      <div
        style={{ width: '50%', height: '500px', background: '#E8EDEF', padding: '10px', overflow: 'auto', border: '1px solid darkgray' }}
      >
        <Tree
          data={items}
          prefixClassName="ecos-menu-settings-editor"
          openAll={false}
          draggable
          onClickActionItem={this.onClickActionItem}
          moveInParent
          moveInLevel
          onDragEnd={this.moveItemTo}
        />
      </div>
    );
  }
}
