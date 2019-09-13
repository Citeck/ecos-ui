import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { t } from '../../helpers/util';
import { Icon } from '../common';

import './style.scss';

class ListFirstLvl extends React.Component {
  static propTypes = {
    items: PropTypes.array
  };

  static defaultProps = {
    items: []
  };

  state = {};

  onClick = () => {};

  render() {
    const { items } = this.props;

    return (
      <ul className="ecos-slide-menu-list_first">
        {items.map(item => {
          return (
            <li key={item.id} id={item.id} className={classNames('ecos-slide-menu-item', { 'ecos-slide-menu-item_collapsed': true })}>
              <Icon className="ecos-slide-menu-item-icon icon-empty-icon" />
              <span className="ecos-slide-menu-item-text">{t(item.label)}</span>
              <span className="ecos-slide-menu-item-badge">?</span>
            </li>
          );
        })}
      </ul>
    );
  }
}

export default ListFirstLvl;
