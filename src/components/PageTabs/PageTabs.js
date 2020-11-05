import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { push, replace } from 'connected-react-router';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
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
  updateTabsFromStorage
} from '../../actions/pageTabs';
import { animateScrollTo, arrayCompare, getScrollbarWidth, t } from '../../helpers/util';
import PageService from '../../services/PageService';
import UserLocalSettingsService from '../../services/userLocalSettings';
import { SortableContainer } from '../Drag-n-Drop';
import ClickOutside from '../ClickOutside';
import { dropByCacheKey } from '../ReactRouterCache';
import Tab from './Tab';
import { PANEL_CLASS_NAME } from '../../constants/pageTabs';
import { replaceHistoryLink } from '../../helpers/urls';

import './style.scss';
import { updateTabEmitter } from '../../services/pageTabs/PageTabList';

const Labels = {
  GO_HOME: 'header.site-menu.go-home-page'
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

  state = {
    isActiveLeftArrow: false,
    isActiveRightArrow: false,
    needArrow: false,
    enableCache: false,
    draggableNode: null
  };

  inited = false;

  $tabWrapper = React.createRef();

  constructor(props) {
    super(props);

    this.checkUrl();

    updateTabEmitter.on('update', props.updateTabs);
  }

  componentDidMount() {
    const { initTabs } = this.props;

    initTabs();
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const { tabs, isShow, inited, location } = this.props;
    const { draggableNode: oldDraggableNode, ...oldState } = this.state;
    const { draggableNode, ...newState } = nextState;

    return (
      !arrayCompare(nextProps.tabs, tabs) ||
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
        } else if (!arrayCompare(prevProps.tabs, tabs)) {
          this.checkNeedArrow();
        }
      }
    }
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

  scrollToTop = () => {
    animateScrollTo(document.querySelectorAll(`.${PANEL_CLASS_NAME}`), { scrollTop: 0 });
  };

  updateTab = tab => {
    this.props.updateTab({ tab });
  };

  handleAddTab = () => {
    const { setTab, homepageLink } = this.props;

    setTab({ data: { link: homepageLink, isActive: true }, params: { last: true } });
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
        <div className="page-tab__tabs-add icon-small-plus" title={t(Labels.GO_HOME)} onClick={this.handleAddTab} />
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

  render() {
    const { tabs, ContentComponent, location } = this.props;

    return (
      <>
        {this.renderTabWrapper()}
        {ContentComponent && (
          <this.renderTabPanes url={location.pathname + location.search} tabs={tabs} ContentComponent={ContentComponent} />
        )}
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
  push: url => dispatch(push(url)),
  replace: url => dispatch(replace(url)),
  updateTabs: () => dispatch(updateTabsFromStorage())
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(PageTabs)
);
