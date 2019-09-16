import React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import { t } from '../../helpers/util';
import List from './List';

import './style.scss';

class ListRoot extends React.Component {
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
        <ul className="ecos-slide-menu-list_root">
          {items.map(item => {
            return (
              <li key={item.id} id={item.id}>
                <div className="ecos-slide-menu-item__label">{t(item.label)}</div>
                <List items={item.items} />
              </li>
            );
          })}
        </ul>
      </Scrollbars>
    );
  }
}

export default ListRoot;
