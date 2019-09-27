import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class Tabs extends Component {
  static propTypes = {
    tabs: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        isActive: PropTypes.bool,
        isAvailable: PropTypes.bool
      })
    ),
    className: PropTypes.string,
    classNameItem: PropTypes.string,
    onClick: PropTypes.func,
    isSmall: PropTypes.bool
  };

  static defaultProps = {
    tabs: [],
    className: '',
    classNameItem: '',
    onClick: () => {}
  };

  handleClickTabItem = (tab, index) => {
    if (!tab.isAvailable) {
      return;
    }

    this.props.onClick(index);
  };

  renderTab = (tab, index) => {
    const { classNameItem } = this.props;
    const { isActive = false, isAvailable = false, name = '', badge = null } = tab;

    return (
      <div
        key={index}
        className={classNames('ecos-tabs-v2__item', classNameItem, {
          'ecos-tabs-v2__item_active': isActive,
          'ecos-tabs-v2__item_disabled': !isAvailable
        })}
        onClick={this.handleClickTabItem.bind(null, tab, index)}
      >
        <span className="ecos-tabs-v2__item-label">{name}</span>
        {badge !== null && <div className="ecos-tabs-v2__item-badge">{badge}</div>}
      </div>
    );
  };

  render() {
    const { tabs, isSmall, className } = this.props;

    return <div className={classNames('ecos-tabs-v2', className, { 'ecos-tabs-v2_small': isSmall })}>{tabs.map(this.renderTab)}</div>;
  }
}

export default React.memo(Tabs);
