import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import { t } from '../../helpers/util';
import ListFirstLvl from './ListFirstLvl';

class ListZeroLvl extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    items: PropTypes.array
  };

  static defaultProps = {
    className: '',
    items: []
  };

  render() {
    const { items } = this.props;

    const verticalTrack = props => <div {...props} className="ecos-slide-menu-scroll_v" />;

    return (
      <Scrollbars ref={el => (this.scrollbar = el)} autoHide renderTrackVertical={verticalTrack}>
        <ul className="ecos-slide-menu-list_zero">
          {items.map(item => {
            return (
              <li
                key={item.id}
                id={item.id}
                className={classNames('ecos-slide-menu-item', { 'ecos-slide-menu__top-list__item_collapsed': true })}
              >
                <div className="ecos-slide-menu-item-text">{t(item.label)}</div>
                <ListFirstLvl items={item.items} />
              </li>
            );
          })}
        </ul>
      </Scrollbars>
    );
  }
}

export default ListZeroLvl;
