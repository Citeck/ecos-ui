import React from 'react';

import { Tree } from '../../components/common';
import { deepClone } from '../../helpers/util';
import { treeMoveItem, treeSetDndIndex } from '../../helpers/arrayOfObjects';
import { toGeneratorTree } from '../../helpers/dataGenerators';
import { Btn, IcoBtn } from '../../components/common/btns';
import { MLText, MLTextarea } from '../../components/common/form';

const _actions = [
  {
    type: 'PRINT',
    icon: 'icon-print',
    visible: true
  },
  {
    type: 'ACTIVE',
    icon: 'icon-small-eye-show',
    visible: true
  },
  {
    type: 'NO_ACTIVE',
    icon: 'icon-small-eye-hide',
    visible: false
  }
];

const _items = toGeneratorTree(5, 3);

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
    items: treeSetDndIndex(_items),
    text: { en: '', ru: '' },
    textarea: { en: '', ru: '' }
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
    const original = this.state.items;
    const _items = treeMoveItem({ fromId, toId, original, key: 'dndIdx' });
    const items = treeSetDndIndex(_items);

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
        <div style={{ padding: '10px 15px' }}>
          <MLText lang="ru" style={{ width: '200px' }} value={this.state.text} onChange={text => this.setState({ text })} />

          <MLTextarea lang="ru" style={{ width: '200px' }} value={this.state.textarea} onChange={textarea => this.setState({ textarea })} />
        </div>

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
            draggable
            onDragEnd={this.moveItemTo}
          />
        </div>
      </div>
    );
  }
}
