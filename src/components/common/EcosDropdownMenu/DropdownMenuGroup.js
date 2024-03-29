import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../helpers/util';
import Separator from '../Separator/Separator';
import DropdownMenuItem from './DropdownMenuItem';

export default class DropdownMenuGroup extends React.Component {
  static propTypes = {
    groups: PropTypes.array,
    showGroupName: PropTypes.bool,
    showSeparator: PropTypes.bool,
    onClick: PropTypes.func
  };

  static defaultProps = {
    groups: [],
    onClick: _ => _
  };

  renderMenuItems(items) {
    return isEmpty(items) ? null : items.map((item, key) => <DropdownMenuItem key={key} data={item} onClick={this.props.onClick} />);
  }

  render() {
    const { groups, showGroupName, showSeparator } = this.props;

    return groups.map((item, i) => {
      const { id, label, items } = item;
      const key = `key-${i}-${id}`;

      return (
        <div key={key} className="ecos-dropdown-menu__group">
          {showSeparator && !!i && <Separator noIndents />}
          {!item.isolated && showGroupName && <div className="ecos-dropdown-menu__group-label">{t(label)}</div>}
          {this.renderMenuItems(item.isolated ? [item] : items)}
        </div>
      );
    });
  }
}
