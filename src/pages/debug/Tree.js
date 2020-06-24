import React from 'react';

import { Tree } from '../../components/common';
import { deepClone } from '../../helpers/util';
import { treeMoveItem } from '../../helpers/arrayOfObjects';
import { toGeneratorTree } from '../../helpers/dataGenerators';
import { Btn, IcoBtn } from '../../components/common/btns';

const _actions = [
  {
    type: 'PRINT',
    icon: 'icon-print',
    visible: true
  },
  {
    type: 'ACTIVE',
    icon: 'icon-on',
    visible: true
  },
  {
    type: 'NO_ACTIVE',
    icon: 'icon-off',
    visible: false
  }
];

const _items = toGeneratorTree(5, 2);

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

export default class extends React.Component {
  state = {
    items: _items
  };

  onClickActionItem = ({ action, item }) => {
    switch (action) {
      case 'ACTIVE':
      case 'NO_ACTIVE':
        const items = deepClone(this.state.items);
        const foundItem = findItem(items, item.id);

        foundItem.visible = !foundItem.visible;
        foundItem.locked = !foundItem.visible;
        this.setState({ items });
        break;
      case 'PRINT':
        window.print();
        break;
      default:
        break;
    }
  };

  moveItemTo = (fromId, toId) => {
    const items = treeMoveItem({ fromId, toId, original: this.state.items, key: 'dndIdx' });
    this.setState({ items });
  };

  renderExtraComponents = ({ item }) => {
    return (
      <IcoBtn icon="icon-question" className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={() => alert("It's " + item.name)}>
        Click Me
      </IcoBtn>
    );
  };

  getAvailableActions = item => {
    return _actions.filter(act => act.visible === item.visible);
  };

  toggleOpenAll = () => {
    this.setState(({ openAllMenuItems }) => ({ openAllMenuItems: !openAllMenuItems }));
  };

  render() {
    const { items, openAllMenuItems } = this.state;

    return (
      <div>
        <Btn className="ecos-btn_hover_light-blue2 ecos-btn_sq_sm" onClick={this.toggleOpenAll}>
          {openAllMenuItems ? 'Свернуть все' : 'Развернуть все'}
        </Btn>
        <div
          style={{ width: '50%', height: '500px', background: '#E8EDEF', padding: '10px', overflow: 'auto', border: '1px solid darkgray' }}
        >
          <Tree
            data={items}
            prefixClassName="ecos-menu-settings-editor"
            openAll={openAllMenuItems}
            onClickAction={this.onClickActionItem}
            getActions={this.getAvailableActions}
            renderExtraComponents={this.renderExtraComponents}
          />
        </div>
      </div>
    );
  }
}
