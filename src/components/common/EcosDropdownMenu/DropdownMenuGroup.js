import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';

import { t } from '../../../helpers/util';
import { Separator } from '../';
import DropdownMenuItem from './DropdownMenuItem';

export default class DropdownMenuGroup extends React.Component {
  static propTypes = {
    groups: PropTypes.array,
    showGroupName: PropTypes.bool,
    showSeparator: PropTypes.bool
  };

  static defaultProps = {
    groups: [],
    showGroupName: false,
    showSeparator: false
  };

  renderMenuItems(items) {
    return isEmpty(items) ? [] : items.map((item, key) => <DropdownMenuItem key={key} data={item} />);
  }

  render() {
    const { groups, showGroupName, showSeparator } = this.props;

    return groups.map((item, i) => {
      const { id, label, items } = item;
      const key = `key-${i}-${id}`;

      return (
        <div key={key}>
          {showGroupName && <div className="ecos-dropdown-menu__group-label">{t(label)}</div>}
          {this.renderMenuItems(items)}
          {showSeparator && <Separator noIndents />}
        </div>
      );
    });
  }
}
