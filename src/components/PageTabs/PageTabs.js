import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import ReactResizeDetector from 'react-resize-detector';
import classNames from 'classnames';

import Tab from './Tab';
import { arrayCompare, arrayMove, deepClone, getScrollbarWidth, animateScrollTo } from '../../helpers/util';
import { SortableContainer } from '../Drag-n-Drop';
import {
  getTitleByUrl,
  IGNORE_TABS_HANDLER_ATTR_NAME,
  LINK_TAG,
  OPEN_IN_BACKGROUND,
  REMOTE_TITLE_ATTR_NAME,
  SCROLL_STEP,
  TITLE
} from '../../constants/pageTabs';
import { decodeLink, isNewVersionPage, compareUrls, SEARCH_KEYS } from '../../helpers/urls';

import './style.scss';

const CHANGE_URL_LINK_EVENT = 'CHANGE_URL_LINK_EVENT';
const customEvent = document.createEvent('Event');

/**
 *
 * @param link - string
 * @param params
 *    checkUrl - bool,
 *    openNewTab - bool,
 *    openNewBrowserTab - bool,
 *    reopenBrowserTab - bool,
 *    closeActiveTab - bool
 *    openInBackground - bool
 */
export const changeUrlLink = (link = '', params = {}) => {
  customEvent.params = { link, ...params };
  document.dispatchEvent(customEvent);
};

class PageTabs extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }),
    homepageLink: PropTypes.string.isRequired,
    isShow: PropTypes.bool,
    inited: PropTypes.bool,
    isLoadingTitle: PropTypes.bool,
    tabs: PropTypes.array,
    linkIgnoreAttr: PropTypes.string,

    saveTabs: PropTypes.func,
    getTabTitle: PropTypes.func,
    changeActiveTab: PropTypes.func
  };

  static defaultProps = {
    children: null,
    isShow: false,
    inited: false,
    isLoadingTitle: false,
    tabs: [],
    linkIgnoreAttr: IGNORE_TABS_HANDLER_ATTR_NAME,

    saveTabs: () => {},
    changeActiveTab: () => {},
    getTabTitle: () => {}
  };

  state = {
    tabs: [],
    isActiveLeftArrow: false,
    isActiveRightArrow: false,
    needArrow: false,
    draggableNode: null,
    isNewTab: false,
    activeTab: '',
    needScrollToActive: false
  };

  constructor(props) {
    super(props);

    this.state.tabs = props.tabs;
    this.state.activeTab = get(props.tabs.find(tab => tab.isActive), 'id', '');
    this.$tabWrapper = React.createRef();
  }

  componentDidMount() {
    if (this.props.isShow && this.props.inited) {
      this.init();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.isShow) {
      if (nextProps.isShow !== this.props.isShow && !nextProps.tabs.length && nextProps.inited) {
        const hasRecordRef = this.linkFromUrl.includes('recordRef');

        let propsFirstTab = {
          tabsCount: 0,
          props: nextProps
        };

        if (hasRecordRef) {
          propsFirstTab = {
            ...propsFirstTab,
            link: this.linkFromUrl,
            remoteTitle: true
          };
        }

        const tabs = [this.generateNewTab(propsFirstTab)];

        nextProps.saveTabs(tabs);
        this.setState({ tabs });
      }

      if (JSON.stringify(nextProps.tabs) !== JSON.stringify(nextState.tabs)) {
        this.setState(
          {
            tabs: nextProps.tabs,
            needScrollToActive: true,
            activeTab: get(nextProps.tabs.find(tab => tab.isActive), 'id', '')
          },
          () => (nextState.isNewTab ? null : this.checkUrls(nextProps, nextState))
        );
      }

      if (this.state.activeTab !== nextState.activeTab) {
        this.setState({ needScrollToActive: true });
      }
    }

    return true;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.scrollToActiveTab();

    if (!arrayCompare(prevState.tabs, this.state.tabs)) {
      this.checkNeedArrow();
    }

    if (!prevProps.isShow && this.props.isShow && this.props.inited) {
      this.init();
    }
  }

  componentWillUnmount() {
    window.clearInterval(this.checkArrowID);
    document.removeEventListener('click', this.handleClickLink);
    document.removeEventListener(CHANGE_URL_LINK_EVENT, this.handleCustomEvent);
    window.removeEventListener('popstate', this.handlePopState);
    this.checkArrowID = null;
  }

  init() {
    customEvent.initEvent(CHANGE_URL_LINK_EVENT, true, true);

    this.checkUrls();
    this.initArrows();

    document.addEventListener('click', this.handleClickLink);
    document.addEventListener(CHANGE_URL_LINK_EVENT, this.handleCustomEvent, false);
    window.addEventListener('popstate', this.handlePopState);
  }

  get wrapper() {
    return get(this.$tabWrapper, 'current', null);
  }

  get linkFromUrl() {
    const {
      history: {
        location: { pathname, search, hash }
      }
    } = this.props;

    return decodeLink([pathname, search, hash].join(''));
  }

  scrollToActiveTab = () => {
    const { needScrollToActive, needArrow } = this.state;
    const wrapper = this.wrapper;

    if (!needScrollToActive || !wrapper || !needArrow) {
      return;
    }

    const activeTabElement = wrapper.querySelector('.page-tab__tabs-item_active');
    const scrollLeft = activeTabElement.offsetLeft - wrapper.offsetWidth / 2 + activeTabElement.offsetWidth / 2;

    animateScrollTo(wrapper, { scrollLeft });
    this.checkNeedArrow(scrollLeft);
    this.setState({ needScrollToActive: false });
  };

  initArrows() {
    this.checkArrowID = window.setInterval(() => {
      const wrapper = this.wrapper;

      if (wrapper) {
        this.checkNeedArrow();

        const { left: activeLeft, width: activeWidth } = wrapper.querySelector('.page-tab__tabs-item_active').getBoundingClientRect();
        let scrollValue = activeLeft - activeWidth / 2 - getScrollbarWidth() - wrapper.offsetWidth / 2;

        scrollValue = wrapper.scrollWidth > wrapper.offsetWidth + getScrollbarWidth() ? scrollValue : 0;

        this.setState({
          isActiveRightArrow: wrapper.scrollWidth - wrapper.scrollLeft - wrapper.offsetWidth > 0,
          isActiveLeftArrow: scrollValue > 0
        });

        window.clearInterval(this.checkArrowID);
        this.checkArrowID = null;
      }
    }, 300);
  }

  checkUrls(props = this.props, state = this.state) {
    const { saveTabs, inited } = props;
    const { tabs: oldTabs, isNewTab } = state;
    const tabs = deepClone(oldTabs);
    const activeTab = tabs.find(tab => tab.isActive === true);
    const linkFromUrl = this.linkFromUrl;

    if (isNewTab || !inited) {
      return;
    }

    if (activeTab) {
      if (
        !compareUrls({
          urls: [activeTab.link, linkFromUrl],
          ignored: [SEARCH_KEYS.PAGINATION, SEARCH_KEYS.FILTER, SEARCH_KEYS.SORT],
          compareBy: ['journalsListId']
        })
      ) {
        const newActiveTab = tabs.find(tab => tab.link === linkFromUrl);

        if (newActiveTab) {
          this.activeTab(newActiveTab);
        } else {
          tabs.forEach(item => {
            item.isActive = false;
          });
          tabs.push(this.generateNewTab({ link: linkFromUrl }));
          saveTabs(tabs);

          this.setState({ tabs });
        }
      }
    }
  }

  generateNewTab(params = {}) {
    const { props = this.props, link = '', remoteTitle = false, isActive = true } = params;
    const { homepageLink, getTabTitle } = props;
    const id = Math.random()
      .toString(36)
      .substring(6);
    const tabLink = link || homepageLink;
    let isLoading = false;

    getTabTitle({ tabId: id, link: tabLink, isActive, defaultTitle: remoteTitle ? TITLE.NEW_TAB : this.getTitle(link || homepageLink) });

    if (remoteTitle) {
      isLoading = true;
    }

    return {
      id,
      isActive,
      isLoading,
      link: tabLink,
      title: remoteTitle ? TITLE.NEW_TAB : this.getTitle(link || homepageLink)
    };
  }

  checkNeedArrow(calculatedScrollLeft = null) {
    if (this.wrapper) {
      const { scrollWidth, offsetWidth, scrollLeft: wrapperScrollLeft } = this.wrapper;
      const needArrow = scrollWidth > offsetWidth + getScrollbarWidth();
      const scrollLeft = calculatedScrollLeft === null ? wrapperScrollLeft : calculatedScrollLeft;

      if (!needArrow) {
        animateScrollTo(this.wrapper, { scrollLeft: 0 });
      }

      this.setState({
        needArrow,
        isActiveRightArrow: scrollWidth > offsetWidth + scrollLeft,
        isActiveLeftArrow: scrollLeft > 0
      });
    }
  }

  handleCustomEvent = event => {
    /**
     * params:
     *    link - string,
     *    checkUrl - bool,
     *    openNewTab - bool,
     *    openNewBrowserTab - bool,
     *    reopenBrowserTab - bool,
     *    closeActiveTab - bool
     *    openInBackground - bool
     */
    const {
      params: {
        checkUrl = false,
        openNewTab = false,
        openNewBrowserTab = false,
        reopenBrowserTab = false,
        closeActiveTab = false,
        remoteTitle = false,
        openInBackground = false
      }
    } = event;
    const { isShow } = this.props;
    const tabs = deepClone(this.state.tabs);
    const link = decodeLink(event.params.link || '');

    if (!isShow) {
      this.props.history.push.call(this, link);

      return;
    }

    if (closeActiveTab) {
      const activeIndex = tabs.findIndex(tab => tab.isActive);

      if (activeIndex !== -1) {
        if (!link) {
          this.closeTab(tabs[activeIndex].id);

          return;
        }

        tabs.splice(activeIndex, 1);
      }
    }

    if (checkUrl) {
      this.checkUrls();

      return;
    }

    const { saveTabs, history } = this.props;

    event.preventDefault();

    if (openNewBrowserTab) {
      const tab = window.open(link, '_blank');

      tab.focus();

      return;
    }

    if (reopenBrowserTab) {
      const tab = window.open(link, '_self');

      tab.focus();

      return;
    }

    if (openNewTab) {
      const newActiveTab = tabs.find(tab => tab.link === link);

      if (newActiveTab) {
        this.activeTab(newActiveTab, tabs);
      } else {
        tabs.forEach(item => (item.isActive = false));
        tabs.push(this.generateNewTab({ link, remoteTitle }));
        saveTabs(tabs);
        history.push.call(this, link);

        this.setState({ tabs }, () => {
          if (this.checkScrollPosition()) {
            this.checkNeedArrow();
          }
        });
      }

      return;
    }

    if (openInBackground) {
      const newTab = this.generateNewTab({ link, remoteTitle: true, isActive: false });

      tabs.push(newTab);
      saveTabs(tabs);

      return;
    }

    // default behavior - open on this tab with replace url
    const tab = tabs.find(tab => tab.isActive);

    tab.link = link;
    tab.title = this.getTitle(link);

    saveTabs(tabs);
    history.replace.call(this, link);
  };

  handlePopState = () => {
    const { tabs, saveTabs } = this.props;
    const newTabs = deepClone(tabs);
    const tab = newTabs.find(tab => tab.isActive);
    const linkFromUrl = this.linkFromUrl;

    tab.link = linkFromUrl;
    tab.title = this.getTitle(linkFromUrl);

    saveTabs(newTabs);
    this.setState({ tabs: newTabs });
  };

  handleClickLink = event => {
    const { isShow, linkIgnoreAttr } = this.props;
    let elem = event.currentTarget;

    if (!isShow) {
      return;
    }

    if (elem.tagName !== LINK_TAG) {
      elem = event.target.closest('a[href]');
    }

    if (!elem || elem.tagName !== LINK_TAG || !!elem.getAttribute(linkIgnoreAttr)) {
      return;
    }

    const { saveTabs, history } = this.props;
    const tabs = deepClone(this.state.tabs);
    const link = decodeLink(elem.getAttribute('href'));

    if (!isNewVersionPage(link)) {
      return;
    }

    event.preventDefault();

    const isNewTab = elem.getAttribute('target') === '_blank';
    const isBackgroundOpening = elem.getAttribute(OPEN_IN_BACKGROUND);
    const remoteTitle = !!elem.getAttribute(REMOTE_TITLE_ATTR_NAME);
    const withLinkTabIndex = tabs.findIndex(tab => tab.link === link);

    if (isBackgroundOpening || (event.button === 0 && event.ctrlKey)) {
      const newTab = this.generateNewTab({ link, remoteTitle: true, isActive: false });

      tabs.push(newTab);
      saveTabs(tabs);
      this.setState({ tabs }, () => {
        if (this.checkScrollPosition(false)) {
          this.checkNeedArrow();
        }
      });

      return;
    }

    if (withLinkTabIndex !== -1) {
      tabs.forEach((tab, index) => {
        tab.isActive = withLinkTabIndex === index;
      });

      saveTabs(tabs);
      history.push.call(this, link);
      this.setState({ tabs, needScrollToActive: true }, this.scrollToActiveTab);

      return;
    }

    if (isNewTab) {
      tabs.forEach(tab => (tab.isActive = false));
      tabs.push(this.generateNewTab({ link, remoteTitle }));
    } else {
      const tab = tabs.find(tab => tab.isActive);

      tab.link = link;
      tab.title = this.getTitle(link);
    }

    saveTabs(tabs);

    this.setState({ tabs }, () => {
      history.push.call(this, link);

      if (this.checkScrollPosition()) {
        this.checkNeedArrow();
      }
    });
  };

  handleCloseTab = tabId => {
    this.closeTab(tabId);
  };

  handleMouseUp = (tabId, isWheelButton) => {
    if (isWheelButton) {
      this.handleCloseTab(tabId);
    }
  };

  handleClickTab = tab => {
    if (tab.isActive) {
      return;
    }

    this.props.changeActiveTab({ url: tab.link });
    this.activeTab(tab);
  };

  handleAddTab = () => {
    this.setState(
      state => {
        const { history, saveTabs } = this.props;
        const tabs = deepClone(state.tabs);
        const newTab = this.generateNewTab({ isActive: true });

        tabs.forEach(tab => {
          tab.isActive = false;
        });
        tabs.push(newTab);
        history.push.call(this, newTab.link);
        saveTabs(tabs);

        return { tabs, isNewTab: true };
      },
      () => {
        if (this.checkScrollPosition()) {
          this.checkNeedArrow();
          this.setState({ isNewTab: false });
        }
      }
    );
  };

  /**
   * Checking scroll position and return true, when scrolled has happened
   *
   * @returns {boolean}
   */
  checkScrollPosition(needScollTo = true) {
    const wrapper = this.wrapper;

    if (wrapper) {
      if (wrapper.scrollWidth > wrapper.offsetWidth + getScrollbarWidth()) {
        if (needScollTo) {
          animateScrollTo(wrapper, { scrollLeft: wrapper.scrollWidth });
          this.checkNeedArrow();
        }

        return true;
      }
    }

    return false;
  }

  handleScrollLeft = () => {
    const { isActiveLeftArrow } = this.state;

    if (!isActiveLeftArrow) {
      return false;
    }

    if (this.wrapper) {
      let { scrollLeft } = this.wrapper;

      scrollLeft -= SCROLL_STEP;

      if (scrollLeft < 0) {
        scrollLeft = 0;
      }

      if (scrollLeft === 0) {
        this.setState({
          isActiveLeftArrow: false
        });
      }

      this.setState({
        isActiveRightArrow: true
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

      scrollLeft += SCROLL_STEP;

      if (clientWidth + scrollLeft >= scrollWidth) {
        scrollLeft -= clientWidth + scrollLeft - scrollWidth;

        this.setState({
          isActiveRightArrow: false
        });
      }

      this.setState({
        isActiveLeftArrow: true
      });

      animateScrollTo(this.wrapper, { scrollLeft });
    }
  };

  handleBeforeSortStart = ({ node }) => {
    node.classList.toggle('page-tab__tabs-item_sorting');

    this.setState({ draggableNode: node });
  };

  handleSortEnd = ({ oldIndex, newIndex }, event) => {
    const { draggableNode } = this.state;

    event.stopPropagation();
    draggableNode.classList.toggle('page-tab__tabs-item_sorting');

    this.setState(state => {
      const tabs = arrayMove(state.tabs, oldIndex, newIndex);

      this.props.saveTabs(tabs);

      return { tabs, draggableNode: null };
    });
  };

  closeTab(tabId) {
    const { saveTabs, history } = this.props;
    let tabs = deepClone(this.state.tabs);
    const index = tabs.findIndex(tab => tab.id === tabId);
    let needNewTab = false;

    if (index === -1) {
      return false;
    }

    if (tabs[index].isActive) {
      let link = '/';

      switch (index) {
        case 0:
          if (tabs.length === 1) {
            needNewTab = true;
          } else {
            tabs[index + 1].isActive = true;
            link = tabs[index + 1].link;
          }
          break;
        case tabs.length - 1:
          tabs[index - 1].isActive = true;
          link = tabs[index - 1].link;
          break;
        default:
          tabs[index + 1].isActive = true;
          link = tabs[index + 1].link;
      }

      history.push.call(this, link);
    }

    tabs.splice(index, 1);
    saveTabs(tabs);

    this.setState({ tabs }, () => {
      this.checkNeedArrow.bind(this);

      if (needNewTab) {
        this.handleAddTab();
      }
    });
  }

  activeTab = (tab, allTabs = this.state.tabs) => {
    const { history, saveTabs } = this.props;
    const tabs = deepClone(allTabs);

    tabs.forEach(item => {
      item.isActive = item.id === tab.id;
    });

    saveTabs(tabs);
    history.replace.call(this, tab.link);

    this.setState({ tabs, activeTab: tab.id });
  };

  getTitle(url) {
    let cleanUrl = url.replace(/\?.*/i, '');

    cleanUrl = cleanUrl.replace(/#.*/i, '');

    return getTitleByUrl(cleanUrl) || TITLE.NEW_TAB;
  }

  handleResize = debounce(() => {
    this.setState({ needScrollToActive: true }, this.scrollToActiveTab);
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
          <div className="page-tab__nav-btn-icon icon-left" />
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
          <div className="page-tab__nav-btn-icon icon-right" />
        </div>
      </div>
    );
  }

  renderTabItem = (item, position) => {
    const { tabs } = this.state;
    const { isLoadingTitle } = this.props;

    return (
      <Tab
        key={item.id}
        tab={item}
        position={position}
        isLoadingTitle={isLoadingTitle}
        countTabs={tabs.length}
        onClick={this.handleClickTab}
        onMouseUp={this.handleMouseUp}
        onClose={this.handleCloseTab}
        onSortEnd={this.handleSortEnd}
      />
    );
  };

  renderTabWrapper() {
    const { isShow } = this.props;
    const { tabs, isActiveRightArrow, isActiveLeftArrow, needArrow } = this.state;

    if (!tabs.length || !isShow) {
      return null;
    }

    return (
      <div
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
          distance={3}
          updateBeforeSortStart={this.handleBeforeSortStart}
          onSortEnd={this.handleSortEnd}
        >
          <div className="page-tab__tabs" ref={this.$tabWrapper}>
            {tabs.map(this.renderTabItem)}
          </div>
        </SortableContainer>
        <div className="page-tab__tabs-add icon-plus" onClick={this.handleAddTab} />
        {this.renderRightButton()}

        <ReactResizeDetector handleWidth handleHeight onResize={this.handleResize} />
      </div>
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

  render() {
    return (
      <>
        {this.renderTabWrapper()}
        {this.renderChildren()}
      </>
    );
  }
}

export default withRouter(PageTabs);
