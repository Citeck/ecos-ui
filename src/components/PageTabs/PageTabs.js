import React from 'react';
import * as PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import './style.scss';

class PageTabs extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }),
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
      },
      {
        id: 'secondtab',
        position: 1,
        isActive: false,
        link: '/share/page/journals',
        title: 'Вторая страница с очень длинным названием, прям вот таким'
      }
    ]
  };

  state = {
    // ToDO: use tabs from props or from store
    tabs: [
      {
        id: 'firsttab',
        position: 0,
        isActive: true,
        link: '/share/page/journals',
        title: 'Домашняя страница'
      },
      {
        id: 'secondtab',
        position: 1,
        isActive: false,
        link: '/formio-develop',
        title: 'Вторая страница с очень длинным названием, прям вот таким'
      },
      {
        id: '123',
        position: 2,
        isActive: false,
        link: '/share/page/journalsDashboard',
        title: '/share/page/journalsDashboard'
      }
    ]
  };

  handleCloseTab(tabId, event) {
    event.stopPropagation();

    const { tabs } = this.state;
    const index = tabs.findIndex(tab => tab.id === tabId);

    if (index === -1) {
      return false;
    }

    let newTabs = [...tabs];

    newTabs.splice(index, 1);

    this.setState({
      tabs: newTabs
    });
  }

  handleSetActiveTab(tab) {
    const { history } = this.props;
    const { tabs } = this.state;

    tabs.map(item => {
      item.isActive = item.id === tab.id;

      return item;
    });

    this.setState({ tabs }, () => {
      history.push(tab.link);
    });
  }

  renderLeftButton() {
    return (
      <div className="page-tab__nav-btn">
        <div className="page-tab__nav-btn-icon icon-left" />
      </div>
    );
  }

  renderRightButton() {
    return (
      <div className="page-tab__nav-btn page-tab__nav-btn_disable">
        <div className="page-tab__nav-btn-icon icon-right" />
      </div>
    );
  }

  renderTabItem = item => {
    const { history } = this.props;
    const { tabs } = this.state;
    const className = ['page-tab__tabs-item'];
    const closeButton =
      tabs.length > 1 ? <div className="page-tab__tabs-item-close icon-close" onClick={this.handleCloseTab.bind(this, item.id)} /> : null;

    if (item.isActive) {
      className.push('page-tab__tabs-item_active');
    }

    return (
      <div key={item.id} className={className.join(' ')} title={item.title} onClick={this.handleSetActiveTab.bind(this, item)}>
        <span className="page-tab__tabs-item-title">{item.title}</span>
        {closeButton}
      </div>
    );
  };

  renderTabs() {
    const { tabs } = this.state;

    return (
      <div className="page-tab__tabs">
        {tabs.map(this.renderTabItem)}
        <div className="page-tab__tabs-add icon-plus" />
      </div>
    );
  }

  renderTabWrapper() {
    if (!this.state.tabs.length) {
      return null;
    }

    return (
      <div className="page-tab">
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
        <div className="page-tab__body">{children}</div>
      </React.Fragment>
    );
  }
}

export default withRouter(PageTabs);
