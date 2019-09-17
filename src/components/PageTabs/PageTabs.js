import React from 'react';
import * as PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Scrollbars } from 'react-custom-scrollbars';

import { deepClone, getScrollbarWidth, t, arrayMove } from '../../helpers/util';
import { SortableContainer, SortableElement } from '../Drag-n-Drop';
import {
  getTitleByUrl,
  IGNORE_TABS_HANDLER_ATTR_NAME,
  LINK_TAG,
  REMOTE_TITLE_ATTR_NAME,
  SCROLL_STEP,
  TITLE
} from '../../constants/pageTabs';
import { PointsLoader } from '../common';
import { isNewVersionPage } from '../../helpers/urls';

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
    isLoadingTitle: PropTypes.bool,
    tabs: PropTypes.array,
    linkIgnoreAttr: PropTypes.string,

    saveTabs: PropTypes.func,
    changeActiveTab: PropTypes.func
  };

  static defaultProps = {
    children: null,
    isShow: false,
    isLoadingTitle: false,
    tabs: [],
    linkIgnoreAttr: IGNORE_TABS_HANDLER_ATTR_NAME,

    saveTabs: () => {},
    changeActiveTab: () => {},
    getActiveTabTitle: () => {}
  };

  state = {
    tabs: [],
    isActiveLeftArrow: false,
    isActiveRightArrow: false,
    needArrow: false,
    draggableNode: null,
    isNewTab: false
  };

  constructor(props) {
    super(props);

    this.state.tabs = props.tabs;
    this.$tabWrapper = React.createRef();
  }

  componentDidMount() {
    customEvent.initEvent(CHANGE_URL_LINK_EVENT, true, true);

    this.checkUrls();
    this.initArrows();

    document.addEventListener('click', this.handleClickLink);
    document.addEventListener(CHANGE_URL_LINK_EVENT, this.handleCustomEvent, false);
    window.addEventListener('popstate', this.handlePopState);
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (nextProps.isShow) {
      if (nextProps.isShow !== this.props.isShow && !nextProps.tabs.length) {
        const tabs = [this.generateNewTab({ tabsCount: 0, props: nextProps })];

        nextProps.saveTabs(tabs);
        this.setState({ tabs });
      }

      if (JSON.stringify(nextProps.tabs) !== JSON.stringify(nextState.tabs)) {
        this.setState({ tabs: nextProps.tabs }, () => (nextState.isNewTab ? null : this.checkUrls()));
      }
    }

    return true;
  }

  componentWillUnmount() {
    window.clearInterval(this.checkArrowID);
    document.removeEventListener('click', this.handleClickLink);
    document.removeEventListener(CHANGE_URL_LINK_EVENT, this.handleCustomEvent);
    window.removeEventListener('popstate', this.handlePopState);
    this.checkArrowID = null;
  }

  initArrows() {
    this.checkArrowID = window.setInterval(() => {
      const { current } = this.$tabWrapper;

      if (current) {
        this.checkNeedArrow();

        const { left: activeLeft, width: activeWidth } = current.querySelector('.page-tab__tabs-item_active').getBoundingClientRect();
        let scrollValue = activeLeft - activeWidth / 2 - getScrollbarWidth() - current.offsetWidth / 2;

        scrollValue = current.scrollWidth > current.offsetWidth + getScrollbarWidth() ? scrollValue : 0;
        current.scrollLeft = scrollValue;

        this.setState({
          isActiveRightArrow: current.scrollWidth - current.scrollLeft - current.offsetWidth > 0,
          isActiveLeftArrow: scrollValue > 0
        });

        window.clearInterval(this.checkArrowID);
        this.checkArrowID = null;
      }
    }, 300);
  }

  checkUrls() {
    const {
      saveTabs,
      history: {
        location: { pathname, search, hash }
      }
    } = this.props;
    const { tabs: oldTabs, isNewTab } = this.state;
    const tabs = deepClone(oldTabs);
    const activeTab = tabs.find(tab => tab.isActive === true);
    const linkFromUrl = [pathname, search, hash].join('');

    if (isNewTab) {
      return;
    }

    if (activeTab) {
      if (activeTab.link !== linkFromUrl) {
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
    const { props = this.props, link = '', remoteTitle = false } = params;
    const { homepageLink } = props;

    return {
      id: Math.random()
        .toString(36)
        .substring(6),
      isActive: true,
      link: link || homepageLink,
      title: remoteTitle ? TITLE.NEW_TAB : this.getTitle(link || homepageLink)
    };
  }

  checkNeedArrow() {
    if (this.$tabWrapper.current) {
      const { scrollWidth, offsetWidth, scrollLeft } = this.$tabWrapper.current;
      const needArrow = scrollWidth > offsetWidth + getScrollbarWidth();

      if (!needArrow) {
        this.$tabWrapper.current.scrollLeft = 0;
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
     */
    const {
      params: {
        link = '',
        checkUrl = false,
        openNewTab = false,
        openNewBrowserTab = false,
        reopenBrowserTab = false,
        closeActiveTab = false,
        remoteTitle = false
      }
    } = event;
    const { isShow } = this.props;
    const tabs = deepClone(this.state.tabs);

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

    const { saveTabs, history, getActiveTabTitle } = this.props;

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
        tabs.forEach(item => {
          item.isActive = false;
        });
        if (remoteTitle) {
          getActiveTabTitle();
        }
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

    // default behavior - open on this tab with replace url
    const tab = tabs.find(tab => tab.isActive);

    tab.link = link;
    tab.title = this.getTitle(link);

    saveTabs(tabs);
    history.replace.call(this, link);
  };

  handlePopState = () => {
    const {
      tabs,
      saveTabs,
      history: {
        location: { pathname, search, hash }
      }
    } = this.props;
    const newTabs = deepClone(tabs);
    const tab = newTabs.find(tab => tab.isActive);
    const linkFromUrl = [pathname, search, hash].join('');

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

    const { saveTabs, history, getActiveTabTitle } = this.props;
    const tabs = deepClone(this.state.tabs);
    const link = elem.getAttribute('href');
    const isNewTab = elem.getAttribute('target') === '_blank';
    const withLinkTabIndex = tabs.findIndex(tab => tab.link === link);

    if (!isNewVersionPage(link)) {
      return;
    }

    event.preventDefault();

    if (withLinkTabIndex !== -1) {
      tabs.forEach((tab, index) => {
        tab.isActive = withLinkTabIndex === index;
      });

      saveTabs(tabs);
      history.push.call(this, link);
      this.setState({ tabs });

      return;
    }

    if (isNewTab) {
      tabs.forEach(tab => {
        tab.isActive = false;
      });
      let remoteTitle = !!elem.getAttribute(REMOTE_TITLE_ATTR_NAME);
      if (remoteTitle) {
        getActiveTabTitle();
      }
      tabs.push(this.generateNewTab({ link, remoteTitle }));
    } else {
      const tab = tabs.find(tab => tab.isActive);

      tab.link = link;
      tab.title = this.getTitle(link);
    }

    saveTabs(tabs);
    history.push.call(this, link);

    this.setState({ tabs }, () => {
      if (this.checkScrollPosition()) {
        this.checkNeedArrow();
      }
    });
  };

  handleCloseTab(tabId, event) {
    event.stopPropagation();
    this.closeTab(tabId);
  }

  handleClickTab(tab) {
    if (tab.isActive) {
      return;
    }

    this.props.changeActiveTab({ url: tab.link });
    this.activeTab(tab);
  }

  handleAddTab = () => {
    this.setState(
      state => {
        const { history, saveTabs } = this.props;
        const tabs = deepClone(state.tabs);
        const newTab = this.generateNewTab.call(this);

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
  checkScrollPosition() {
    const { current } = this.$tabWrapper;

    if (current) {
      if (current.scrollWidth > current.offsetWidth + getScrollbarWidth()) {
        current.scrollLeft = current.scrollWidth;

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

    if (this.$tabWrapper.current) {
      const { current } = this.$tabWrapper;
      let { scrollLeft } = current;

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

      current.scrollLeft = scrollLeft;
    }
  };

  handleScrollRight = () => {
    const { isActiveRightArrow } = this.state;

    if (!isActiveRightArrow) {
      return false;
    }

    if (this.$tabWrapper.current) {
      const { current } = this.$tabWrapper;
      let { scrollLeft, scrollWidth, clientWidth } = current;

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

      current.scrollLeft = scrollLeft;
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

    if (index === -1) {
      return false;
    }

    if (tabs[index].isActive) {
      let link = '/';

      switch (index) {
        case tabs.length - 1:
          tabs[index - 1].isActive = true;
          link = tabs[index - 1].link;
          break;
        case 0:
          tabs[index + 1].isActive = true;
          link = tabs[index + 1].link;
          break;
        default:
          tabs[index + 1].isActive = true;
          link = tabs[index + 1].link;
      }

      history.push.call(this, link);
    }

    tabs.splice(index, 1);
    saveTabs(tabs);

    this.setState({ tabs }, this.checkNeedArrow.bind(this));
  }

  activeTab = (tab, allTabs = this.state.tabs) => {
    const { history, saveTabs } = this.props;
    const tabs = deepClone(allTabs);

    tabs.forEach(item => {
      item.isActive = item.id === tab.id;
    });

    saveTabs(tabs);
    history.replace.call(this, tab.link);

    this.setState({ tabs });
  };

  getTitle(url) {
    let cleanUrl = url.replace(/\?.*/i, '');

    cleanUrl = cleanUrl.replace(/#.*/i, '');

    return getTitleByUrl(cleanUrl) || TITLE.NEW_TAB;
  }

  renderLeftButton() {
    const { isActiveLeftArrow, needArrow } = this.state;

    if (!needArrow) {
      return <div className="page-tab__nav-btn-placeholder" />;
    }

    const arrowClassName = ['page-tab__nav-btn'];

    if (!isActiveLeftArrow) {
      arrowClassName.push('page-tab__nav-btn_disable');
    }

    return (
      <div className="page-tab__nav-btn-placeholder">
        <div className={arrowClassName.join(' ')} onClick={this.handleScrollLeft}>
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

    const arrowClassName = ['page-tab__nav-btn'];

    if (!isActiveRightArrow) {
      arrowClassName.push('page-tab__nav-btn_disable');
    }

    return (
      <div className="page-tab__nav-btn-placeholder">
        <div className={arrowClassName.join(' ')} onClick={this.handleScrollRight}>
          <div className="page-tab__nav-btn-icon icon-right" />
        </div>
      </div>
    );
  }

  renderTabItem = (item, position) => {
    const { tabs } = this.state;
    const { isLoadingTitle } = this.props;
    const className = ['page-tab__tabs-item'];
    const closeButton =
      tabs.length > 1 ? <div className="page-tab__tabs-item-close icon-close" onClick={this.handleCloseTab.bind(this, item.id)} /> : null;

    if (item.isActive) {
      className.push('page-tab__tabs-item_active');
    }

    if (isLoadingTitle) {
      className.push('page-tab__tabs-item_disabled');
    }

    return (
      <SortableElement key={item.id} index={position} onSortEnd={this.handleSortEnd}>
        <div key={item.id} className={className.join(' ')} title={t(item.title)} onClick={this.handleClickTab.bind(this, item)}>
          <span className="page-tab__tabs-item-title">
            {isLoadingTitle && item.isActive && <PointsLoader className={'page-tab__tabs-item-title-loader'} />}
            {t(item.title)}
          </span>
          {closeButton}
        </div>
      </SortableElement>
    );
  };

  renderTabWrapper() {
    const { isShow } = this.props;
    const { tabs, isActiveRightArrow, isActiveLeftArrow, needArrow } = this.state;

    if (!tabs.length || !isShow) {
      return null;
    }

    const className = ['page-tab'];

    if (needArrow) {
      if (isActiveRightArrow) {
        className.push('page-tab_gradient-right');
      }

      if (isActiveLeftArrow) {
        className.push('page-tab_gradient-left');
      }
    }

    return (
      <div className={className.join(' ')} key="tabs-wrapper">
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
