import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import DropdownMenuItem from '../DropdownMenuItem';
import { t } from '../../../../../helpers/util';
import Separator from '../../../Separator/Separator';

export default class DropdownMenuGroup extends React.Component {
  static propTypes = {
    groups: PropTypes.array,
    showLabel: PropTypes.bool,
    showSeparator: PropTypes.bool
  };

  static defaultProps = {
    groups: [],
    showLabel: false,
    showSeparator: false
  };

  renderMenuItems(items) {
    return isEmpty(items)
      ? []
      : items.map((item, key) => {
          return <DropdownMenuItem key={key} data={item} />;
        });
  }

  render() {
    const { groups, showLabel, showSeparator } = this.props;

    return groups.map((item, i) => {
      const { id, label, items } = item;
      const key = `key-${i}-${id}`;

      return (
        <div key={key}>
          {showLabel && <div className={'ecos-dropdown-menu__group-label'}>{t(label)}</div>}
          {this.renderMenuItems(items)}
          {showSeparator && <Separator noIndents />}
        </div>
      );
    });
  }
}
