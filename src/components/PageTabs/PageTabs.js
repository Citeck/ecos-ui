import React from 'react';
import * as PropTypes from 'prop-types';
import './style.scss';

class PageTabs extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    tabs: PropTypes.array
  };

  static defaultProps = {
    children: null,
    tabs: [
      {
        id: 'firsttab',
        position: 0,
        isActive: true,
        link: '/',
        title: 'Домашняя страница'
      }
    ]
  };

  renderLeftButton() {
    return (
      <div className="ecos-tab__nav-btn">
        <div className="ecos-tab__nav-btn-icon icon-left" />
      </div>
    );
  }

  renderRightButton() {
    return (
      <div className="ecos-tab__nav-btn ecos-tab__nav-btn_disable">
        <div className="ecos-tab__nav-btn-icon icon-right" />
      </div>
    );
  }

  renderTabs() {
    const { tabs } = this.props;

    return (
      <div className="ecos-tab__tabs">
        {tabs.map(item => (
          <div key={item.id} className="ecos-tab__tabs-item" title={item.title}>
            {item.title}
          </div>
        ))}
      </div>
    );
  }

  renderTabWrapper() {
    if (!this.props.tabs.length) {
      return null;
    }

    return (
      <div className="ecos-tab">
        {this.renderLeftButton()}
        {this.renderTabs()}
        {this.renderRightButton()}
      </div>
    );
  }

  render() {
    const { children } = this.props;

    return (
      <React.Fragment>
        {this.renderTabWrapper()}
        {children}
      </React.Fragment>
    );
  }
}

export default PageTabs;
