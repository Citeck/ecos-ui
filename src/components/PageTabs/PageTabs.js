import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import ReactResizeDetector from 'react-resize-detector';
import classNames from 'classnames';
import { withRouter } from 'react-router-dom';

import {
  changeTab,
  deleteTab,
  initTabs,
  moveTabs,
  setDisplayState,
  setTab,
  updateTab,
  updateTabsFromStorage,
  closeTabs
} from '../../actions/pageTabs';
import { animateScrollTo, getScrollbarWidth, t } from '../../helpers/util';
import PageService from '../../services/PageService';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { SortableContainer } from '../Drag-n-Drop';
import ClickOutside from '../ClickOutside';
import { dropByCacheKey } from '../ReactRouterCache';
import Tab from './Tab';
import { MIN_CONTEXT_WIDTH, PANEL_CLASS_NAME } from '../../constants/pageTabs';
import { replaceHistoryLink } from '../../helpers/urls';
import { updateTabEmitter } from '../../services/pageTabs/PageTabList';
import DialogManager from '../common/dialogs/Manager';
import CopyToClipboard from '../../helpers/copyToClipboard';

import './style.scss';

const Labels = {
  GO_HOME: 'page-tabs.go-home-page',
  CLOSE_ALL_TABS: 'page-tabs.close-all-tabs',
  CONFIRM_REMOVE_ALL_TABS_TITLE: 'page-tabs.close-all-tabs-title',
  CONFIRM_REMOVE_ALL_TABS_TEXT: 'page-tabs.close-all-tabs-text',
  CONTEXT_COPY_LINK: 'page-tabs.context-menu.copy-link',
  CONTEXT_CLOSE_SELF: 'page-tabs.context-menu.close-self',
  CONTEXT_CLOSE_OTHER: 'page-tabs.context-menu.close-other',
  CONTEXT_CLOSE_LEFT: 'page-tabs.context-menu.close-left',
  CONTEXT_CLOSE_RIGHT: 'page-tabs.context-menu.close-right',
  CONTEXT_CLOSE_ALL: 'page-tabs.context-menu.close-all'
};
const ContextMenuTypes = {
  COPY_LINK: 'copy-link',
  CLOSE_SELF: 'close-self',
  CLOSE_LEFT: 'close-left',
  CLOSE_RIGHT: 'close-right',
  CLOSE_OTHER: 'close-other',
  CLOSE_ALL: 'close-all',
  GO_SOURCE_HOST: 'go-source-host'
};

class PageTabs extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    ContentComponent: PropTypes.elementType,
    homepageLink: PropTypes.string.isRequired,
    allowedLinks: PropTypes.array,
    isShow: PropTypes.bool,
    enableCache: PropTypes.bool
  };

  #contextPortalElement;

  state = {
    isActiveLeftArrow: false,
    isActiveRightArrow: false,
    needArrow: false,
    enableCache: false,
    draggableNode: null,
    contextMenu: null
  };

  inited = false;

  $tabWrapper = React.createRef();

  constructor(props) {
    super(props);

    this.checkUrl();

    updateTabEmitter.on('update', props.updateTabs);

    this.#contextPortalElement = document.createElement('div');
  }

  componentDidMount() {
    const { initTabs } = this.props;

    initTabs();
    document.body.appendChild(this.#contextPortalElement);
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const { tabs, isShow, inited, location } = this.props;
    const { draggableNode: oldDraggableNode, ...oldState } = this.state;
    const { draggableNode, ...newState } = nextState;

    return (
      !isEqual(nextProps.tabs, tabs) ||
      JSON.stringify(nextProps.location) !== JSON.stringify(location) ||
      JSON.stringify(oldState) !== JSON.stringify(newState) ||
      nextProps.isShow !== isShow ||
      nextProps.inited !== inited ||
      oldDraggableNode !== draggableNode
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { tabs, isShow, inited, setDisplayState } = this.props;
    const activeTabPrev = get(prevProps.tabs.find(tab => tab.isActive), 'id', '');
    const activeTab = get(tabs.find(tab => tab.isActive), 'id', '');

    if (prevProps.isShow !== isShow) {
      setDisplayState(isShow);
    }

    if (isShow) {
      if (inited && !this.inited) {
        this.init();
      } else if (this.inited) {
        if (activeTab !== activeTabPrev && this.checkScrollPosition()) {
          this.handleScrollToActiveTab();
        } else if (!isEqual(prevProps.tabs, tabs)) {
          this.checkNeedArrow();
        }
      }
    }
  }

  componentWillUnmount() {
    updateTabEmitter.off('update', this.props.updateTabs);
    document.body.removeChild(this.#contextPortalElement);
  }

  get wrapper() {
    return get(this.$tabWrapper, 'current', null);
  }

  get elmActiveTab() {
    return this.wrapper && this.wrapper.querySelector('.page-tab__tabs-item_active');
  }

  get sizeTab() {
    return this.wrapper && (this.wrapper.querySelector('.page-tab__tabs-item:not(.page-tab__tabs-item_active)') || {}).offsetWidth;
  }

  checkUrl() {
    const { enableCache, allowedLinks, location, homepageLink, history } = this.props;

    if (!enableCache) {
      return;
    }

    if (!allowedLinks.includes(location.pathname)) {
      replaceHistoryLink(history, homepageLink);
    }
  }

  init() {
    this.inited = true;
    this.initScroll();
  }

  initScroll() {
    const { left: tLeft } = this.elmActiveTab ? this.elmActiveTab.getBoundingClientRect() : {};
    const { left: wLeft } = this.wrapper ? this.wrapper.getBoundingClientRect() : {};
    const isLast = this.elmActiveTab && this.elmActiveTab.nextElementSibling ? 1 : -1;
    const padding = 10;

    this.wrapper && animateScrollTo(this.wrapper, { scrollLeft: tLeft - wLeft - isLast * padding });
    this.checkNeedArrow();
  }

  checkNeedArrow(calculatedScrollLeft = null) {
    if (this.wrapper) {
      const { scrollWidth: _scrollWidth, offsetWidth: _offsetWidth } = this.wrapper;
      const needArrow = _scrollWidth > _offsetWidth + getScrollbarWidth();

      if (!needArrow) {
        animateScrollTo(this.wrapper, { scrollLeft: 0 });
      }

      const { scrollWidth, offsetWidth, scrollLeft: wrapperScrollLeft } = this.wrapper;
      const scrollLeft = calculatedScrollLeft === null ? wrapperScrollLeft : calculatedScrollLeft;

      this.setState({
        needArrow,
        isActiveRightArrow: !(scrollWidth <= offsetWidth + scrollLeft),
        isActiveLeftArrow: scrollLeft > 0
      });
    }
  }

  /**
   * Checking scroll position and return true, when scrolled has happened
   *
   * @returns {boolean}
   */
  checkScrollPosition() {
    if (this.wrapper) {
      if (this.wrapper.scrollWidth > this.wrapper.offsetWidth + getScrollbarWidth()) {
        return true;
      }
    }

    return false;
  }

  closeTab(tab) {
    const { deleteTab, enableCache } = this.props;

    if (enableCache) {
      dropByCacheKey(tab.link);
    }

    UserLocalSettingsService.removeDataOnTab(tab.id);
    deleteTab(tab);
  }

  handleClickLink = event => {
    const { isShow, setTab } = this.props;

    if (!isShow) {
      return;
    }

    const { reopen, closeActiveTab, ...data } = PageService.parseEvent({ event }) || {};

    setTab({ data, params: { reopen, closeActiveTab } });
  };

  handleCloseTab = tab => {
    this.closeTab(tab);
  };

  handleMouseUp = (tab, isWheelButton) => {
    if (isWheelButton) {
      this.handleCloseTab(tab);
    }
  };

  handleClickTab = tab => {
    if (tab.isActive) {
      this.scrollToTop();
      return;
    }

    this.props.changeTab({
      data: { isActive: true },
      filter: { id: tab.id },
      url: tab.link
    });
  };

  handleClickContextMenuItem = type => {
    const { tabs } = this.props;
    const {
      contextMenu: { tab, position }
    } = this.state;

    if (!tab) {
      return;
    }

    switch (type) {
      case ContextMenuTypes.COPY_LINK:
        CopyToClipboard.copy(`${window.location.origin}${tab.link}`);
        break;
      case ContextMenuTypes.CLOSE_ALL:
        this.handleCloseAllTabs();
        break;
      case ContextMenuTypes.CLOSE_RIGHT:
        this.handleCloseTabs(tabs.slice(position + 1), tab);
        break;
      case ContextMenuTypes.CLOSE_LEFT:
        this.handleCloseTabs(tabs.slice(0, position), tab);
        break;
      case ContextMenuTypes.CLOSE_OTHER:
        this.handleCloseTabs(tabs.filter(item => item.id !== tab.id), tab);
        break;
      case ContextMenuTypes.CLOSE_SELF:
        this.handleCloseTab(tab);
        break;
      case ContextMenuTypes.GO_SOURCE_HOST:
        window.open(`${process.env.REACT_APP_SHARE_PROXY_URL}${window.location.pathname}${window.location.search}`, '_blank');
        break;
      default:
        console.error(`PageTabs:ContextMenuItem: Unknown type ${type}`);
    }

    this.handleCloseContextMenu();
  };

  scrollToTop = () => {
    animateScrollTo(document.querySelectorAll(`.${PANEL_CLASS_NAME}`), { scrollTop: 0 });
  };

  updateTab = tab => {
    this.props.updateTab({ tab });
  };

  handleCloseAllTabs = () => {
    DialogManager.confirmDialog({
      title: t(Labels.CONFIRM_REMOVE_ALL_TABS_TITLE),
      text: t(Labels.CONFIRM_REMOVE_ALL_TABS_TEXT),
      onYes: this.handleCloseTabs
    });
  };

  handleCloseTabs = (tabs = this.props.tabs, tab) => {
    const { closeTabs, homepageLink } = this.props;

    closeTabs({ tabs, homepageLink, tab });
  };

  handleScrollLeft = () => {
    const { isActiveLeftArrow } = this.state;

    if (!isActiveLeftArrow) {
      return false;
    }

    if (this.wrapper) {
      let { scrollLeft } = this.wrapper;

      scrollLeft -= this.sizeTab;

      if (scrollLeft < 0) {
        scrollLeft = 0;
      }

      this.setState(() => {
        const state = {};

        if (scrollLeft === 0) {
          state.isActiveLeftArrow = false;
        }

        state.isActiveRightArrow = true;

        return state;
      });

      animateScrollTo(this.wrapper, { scrollLeft });
    }
  };

  handleScrollRight = () => {
    const { isActiveRightArrow } = this.state;

    if (!isActiveRightArrow) {
      return false;
    }

    if (this.wrapper) {
      let { scrollLeft, scrollWidth, clientWidth } = this.wrapper;

      scrollLeft += this.sizeTab;

      this.setState(() => {
        const state = {};

        if (clientWidth + scrollLeft >= scrollWidth) {
          scrollLeft -= clientWidth + scrollLeft - scrollWidth;
          state.isActiveRightArrow = false;
        }

        state.isActiveLeftArrow = true;

        return state;
      });

      animateScrollTo(this.wrapper, { scrollLeft });
    }
  };

  handleScrollToActiveTab = () => {
    const { needArrow } = this.state;

    if (!this.wrapper || !needArrow) {
      return;
    }

    const { offsetLeft = 0, offsetWidth = 0 } = this.elmActiveTab || {};
    const scrollLeft = offsetLeft - this.wrapper.offsetWidth / 2 + offsetWidth / 2;

    animateScrollTo(this.wrapper, { scrollLeft });
    this.checkNeedArrow();
  };

  handleBeforeSortStart = ({ node }) => {
    node.classList.add('page-tab__tabs-item_sorting');
    this.wrapper && this.wrapper.classList.add('page-tab__tabs_sorting');

    this.setState({ draggableNode: node });
  };

  handleSortEnd = ({ oldIndex, newIndex }, event) => {
    const { draggableNode } = this.state;

    event.stopPropagation();
    draggableNode && draggableNode.classList.remove('page-tab__tabs-item_sorting');
    this.wrapper && this.wrapper.classList.remove('page-tab__tabs_sorting');

    this.props.moveTabs({ indexFrom: oldIndex, indexTo: newIndex });
    this.setState({ draggableNode: null });
  };

  handleContextMenu = ({ tab, position, x, y }) => {
    this.setState({
      contextMenu: { tab, position, x, y }
    });
  };

  handleCloseContextMenu = () => {
    this.setState({ contextMenu: null });
  };

  handleResize = debounce(() => {
    this.handleScrollToActiveTab();
    this.checkNeedArrow();
  }, 400);

  renderLeftButton() {
    const { isActiveLeftArrow, needArrow } = this.state;

    if (!needArrow) {
      return <div className="page-tab__nav-btn-placeholder" />;
    }

    return (
      <div className="page-tab__nav-btn-placeholder">
        <div
          className={classNames('page-tab__nav-btn', {
            'page-tab__nav-btn_disable': !isActiveLeftArrow
          })}
          onClick={this.handleScrollLeft}
        >
          <div className="page-tab__nav-btn-icon icon-small-left" />
        </div>
      </div>
    );
  }

  renderCloseAllTabsButton() {
    const { tabs } = this.props;

    if (tabs.length < 2) {
      return null;
    }

    return (
      <div
        className="page-tab__tabs-btn page-tab__tabs-btn_close icon-small-close"
        title={t(Labels.CLOSE_ALL_TABS)}
        onClick={this.handleCloseAllTabs}
      />
    );
  }

  renderRightButton() {
    const { isActiveRightArrow, needArrow } = this.state;

    if (!needArrow) {
      return <div className="page-tab__nav-btn-placeholder" />;
    }

    return (
      <div className="page-tab__nav-btn-placeholder">
        <div
          className={classNames('page-tab__nav-btn', {
            'page-tab__nav-btn_disable': !isActiveRightArrow
          })}
          onClick={this.handleScrollRight}
        >
          <div className="page-tab__nav-btn-icon icon-small-right" />
        </div>
      </div>
    );
  }

  renderTabItem = (item, position) => {
    const { tabs } = this.props;

    return (
      <Tab
        key={item.id}
        tab={item}
        position={position}
        countTabs={tabs.length}
        onClick={this.handleClickTab}
        onMouseUp={this.handleMouseUp}
        onClose={this.handleCloseTab}
        onSortEnd={this.handleSortEnd}
        onContextMenu={this.handleContextMenu}
        runUpdate={this.updateTab}
      />
    );
  };

  renderTabWrapper() {
    const { tabs, isShow } = this.props;
    const { isActiveRightArrow, isActiveLeftArrow, needArrow } = this.state;

    if (!tabs.length || !isShow) {
      return null;
    }

    return (
      <ClickOutside
        type="click"
        handleClickOutside={this.handleClickLink}
        className={classNames('page-tab', {
          'page-tab_gradient-left': needArrow && isActiveLeftArrow,
          'page-tab_gradient-right': needArrow && isActiveRightArrow
        })}
        key="tabs-wrapper"
      >
        {this.renderLeftButton()}
        <SortableContainer
          axis="x"
          lockAxis="x"
          lockToContainerEdges={true}
          lockOffset="20%"
          distance={3}
          updateBeforeSortStart={this.handleBeforeSortStart}
          onSortEnd={this.handleSortEnd}
        >
          <div className="page-tab__tabs" ref={this.$tabWrapper}>
            {tabs.map(this.renderTabItem)}
          </div>
        </SortableContainer>
        {this.renderCloseAllTabsButton()}
        {this.renderRightButton()}
        <ReactResizeDetector handleWidth handleHeight onResize={this.handleResize} />
      </ClickOutside>
    );
  }

  renderChildren() {
    const { children, isShow } = this.props;

    if (isShow && children) {
      return (
        <div className="page-tab__body" key="children">
          <Scrollbars className="page-tab__body-scroll" style={{ height: '100%' }}>
            <div className="page-tab__body-content">{children}</div>
          </Scrollbars>
        </div>
      );
    }

    return children;
  }

  renderTabPanes = React.memo(props => {
    const { tabs, ContentComponent, url } = props;
    const activeTabId = get(tabs.find(tab => tab.isActive), 'id', null);

    return tabs.map(tab =>
      React.createElement(ContentComponent, {
        tab,
        url,
        isActive: activeTabId === tab.id,
        key: tab.id
      })
    );
  });

  renderContextMenu() {
    const { contextMenu } = this.state;

    if (isEmpty(contextMenu)) {
      return null;
    }

    const { tabs } = this.props;
    const { position, x, y } = contextMenu;
    const actions = [
      {
        title: t(Labels.CONTEXT_COPY_LINK),
        onClick: () => this.handleClickContextMenuItem(ContextMenuTypes.COPY_LINK)
      }
    ];
    const minLeft = MIN_CONTEXT_WIDTH + getScrollbarWidth();
    let left = x;

    if (document.body.offsetWidth < left + minLeft) {
      left = document.body.offsetWidth - minLeft;
    }

    if (tabs.length > 1) {
      actions.push({
        title: t(Labels.CONTEXT_CLOSE_SELF),
        onClick: () => this.handleClickContextMenuItem(ContextMenuTypes.CLOSE_SELF)
      });
    }

    if (position !== tabs.length - 1 && position !== 0) {
      actions.push({
        title: t(Labels.CONTEXT_CLOSE_OTHER),
        onClick: () => this.handleClickContextMenuItem(ContextMenuTypes.CLOSE_OTHER)
      });
    }

    if (position > 0) {
      actions.push({
        title: t(Labels.CONTEXT_CLOSE_LEFT),
        onClick: () => this.handleClickContextMenuItem(ContextMenuTypes.CLOSE_LEFT)
      });
    }

    if (position !== tabs.length - 1) {
      actions.push({
        title: t(Labels.CONTEXT_CLOSE_RIGHT),
        onClick: () => this.handleClickContextMenuItem(ContextMenuTypes.CLOSE_RIGHT)
      });
    }

    if (tabs.length > 1) {
      actions.push({
        title: t(Labels.CONTEXT_CLOSE_ALL),
        onClick: () => this.handleClickContextMenuItem(ContextMenuTypes.CLOSE_ALL)
      });
    }

    if (process.env.NODE_ENV === 'development' && get(this.state, 'contextMenu.tab.isActive')) {
      actions.push({
        title: `Go to ${process.env.REACT_APP_SHARE_PROXY_URL}`,
        onClick: () => this.handleClickContextMenuItem(ContextMenuTypes.GO_SOURCE_HOST)
      });
    }

    return ReactDOM.createPortal(
      <ClickOutside
        // type="click"
        className="page-tab__context-menu"
        handleClickOutside={this.handleCloseContextMenu}
        key="tab-context-menu"
        style={{ top: y, left }}
      >
        {actions.map(action => (
          <div key={action.title} className="page-tab__context-menu-item" onClick={action.onClick}>
            {action.title}
          </div>
        ))}
      </ClickOutside>,
      this.#contextPortalElement
    );
  }

  render() {
    const { tabs, ContentComponent, location } = this.props;

    return (
      <>
        {this.renderTabWrapper()}
        {ContentComponent && (
          <this.renderTabPanes url={location.pathname + location.search} tabs={tabs} ContentComponent={ContentComponent} />
        )}
        {this.renderContextMenu()}
      </>
    );
  }
}

const mapStateToProps = state => ({
  location: get(state, 'router.location', {}),
  tabs: get(state, 'pageTabs.tabs', []),
  enableCache: get(state, 'app.enableCache', false),
  inited: get(state, 'pageTabs.inited', false)
});

const mapDispatchToProps = dispatch => ({
  initTabs: () => dispatch(initTabs()),
  moveTabs: params => dispatch(moveTabs(params)),
  setDisplayState: state => dispatch(setDisplayState(state)),
  changeTab: tab => dispatch(changeTab(tab)),
  setTab: params => dispatch(setTab(params)),
  updateTab: tab => dispatch(updateTab(tab)),
  deleteTab: tab => dispatch(deleteTab(tab)),
  closeTabs: data => dispatch(closeTabs(data)),
  updateTabs: () => dispatch(updateTabsFromStorage())
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(PageTabs)
);
