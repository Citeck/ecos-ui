import React from 'react';
import * as PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Scrollbars } from 'react-custom-scrollbars';
import { getScrollbarWidth, deepClone } from '../../helpers/util';
import { SortableContainer, SortableElement } from './sortable';
import { SCROLL_STEP, TITLE, LINK_TAG, IGNORE_TABS_HANDLER_ATTR_NAME, getTitleByUrl } from '../../constants/pageTabs';
import './style.scss';

const CHANGE_URL_LINK_EVENT = 'CHANGE_URL_LINK_EVENT';
const customEvent = document.createEvent('Event');

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
    homepageName: PropTypes.string,
    isShow: PropTypes.bool,
    tabs: PropTypes.array,
    linkIgnoreAttr: PropTypes.string,

    saveTabs: PropTypes.func
  };

  static defaultProps = {
    children: null,
    homepageName: TITLE.HOMEPAGE,
    isShow: false,
    tabs: [],
    linkIgnoreAttr: IGNORE_TABS_HANDLER_ATTR_NAME,

    saveTabs: () => {}
  };

  state = {
    tabs: [],
    isActiveLeftArrow: false,
    isActiveRightArrow: false,
    needArrow: false,
    draggableNode: null
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
    this.initLinkHandler();

    window.setTimeout(() => {
      this.initLinkHandler();
    }, 3000);

    window.addEventListener('popstate', this.handlePopState);
    document.addEventListener(CHANGE_URL_LINK_EVENT, this.handleCustomEvent, false);
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (nextProps.isShow) {
      if (nextProps.isShow !== this.props.isShow && !nextProps.tabs.length) {
        const tabs = [this.generateNewTab({ tabsCount: 0, props: nextProps })];

        nextProps.saveTabs(tabs);
        this.setState({ tabs });
      }

      if (JSON.stringify(nextProps.tabs) !== JSON.stringify(nextState.tabs)) {
        this.setState({ tabs: nextProps.tabs }, () => this.checkUrls());
      }
    }

    return true;
  }

  componentDidUpdate() {
    this.initLinkHandler();
  }

  componentWillUnmount() {
    window.clearInterval(this.checkArrowID);
    this.checkArrowID = null;
    document.removeEventListener('click', this.handleClickLink);
    window.removeEventListener('popstate', this.handlePopState);

    this._links.forEach(link => link.removeEventListener('click', this.handleClickLink));
  }

  initLinkHandler() {
    if (this._links) {
      this._links.forEach(link => link.removeEventListener('click', this.handleClickLink));
    }

    this._links = document.querySelectorAll('a');
    this._links.forEach(link => link.addEventListener('click', this.handleClickLink));
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
    const { tabs } = this.state;
    const activeTab = tabs.find(tab => tab.isActive === true);
    const linkFromUrl = [pathname, search, hash].join('');

    if (activeTab) {
      if (activeTab.link !== linkFromUrl) {
        const newActiveTab = tabs.find(tab => tab.link === linkFromUrl);

        if (newActiveTab) {
          this.activeTab = newActiveTab;
        } else {
          tabs.map(item => {
            item.isActive = false;
            return item;
          });
          tabs.push(this.generateNewTab({ link: linkFromUrl }));
          saveTabs(tabs);

          this.setState({ tabs });
        }
      }
    }
  }

  generateNewTab(params = {}) {
    const { countTabs = this.props.tabs.length, props = this.props, link = '' } = params;
    const { homepageLink, homepageName } = props;

    return {
      id: Math.random()
        .toString(36)
        .substring(6),
      position: countTabs,
      isActive: true,
      link: link || homepageLink,
      title: this.getTitle(link || homepageLink) || homepageName
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
     *    openNewBrowserTab - bool
     */
    const {
      params: { link = '', checkUrl = false, openNewTab = false, openNewBrowserTab = false }
    } = event;

    if (checkUrl) {
      this.checkUrls();

      return;
    }

    const { saveTabs, history, homepageName } = this.props;
    const { tabs } = this.state;

    event.preventDefault();

    if (openNewTab) {
      const newActiveTab = tabs.find(tab => tab.link === link);

      if (newActiveTab) {
        this.activeTab = newActiveTab;
      } else {
        tabs.map(item => {
          item.isActive = false;
          return item;
        });
        tabs.push(this.generateNewTab({ link }));
        saveTabs(tabs);
        history.push(link);

        this.setState({ tabs });
      }

      return;
    }

    if (openNewBrowserTab) {
      const tab = window.open(link, '_blank');

      tab.focus();

      return;
    }

    // default behavior - open on this tab with replace url
    const tab = tabs.find(tab => tab.isActive);

    tab.link = link;
    tab.title = this.getTitle(link) || homepageName;

    saveTabs(tabs);
    history.replace(link);
  };

  handlePopState = () => {
    const {
      tabs,
      saveTabs,
      homepageName,
      history: {
        location: { pathname, search, hash }
      }
    } = this.props;
    const newTabs = deepClone(tabs);
    const tab = newTabs.find(tab => tab.isActive);
    const linkFromUrl = [pathname, search, hash].join('');

    tab.link = linkFromUrl;
    tab.title = this.getTitle(linkFromUrl) || homepageName;

    saveTabs(newTabs);
    this.setState({ tabs: newTabs });
  };

  handleClickLink = event => {
    const { isShow, linkIgnoreAttr } = this.props;
    const elem = event.currentTarget;

    if (!isShow || elem.tagName !== LINK_TAG || !!elem.getAttribute(linkIgnoreAttr)) {
      return;
    }

    const { saveTabs, history, homepageName } = this.props;
    const { tabs } = this.state;
    const link = elem.getAttribute('href');
    const isNewTab = elem.getAttribute('target') === '_blank';
    const withLinkTabIndex = tabs.findIndex(tab => tab.link === link);

    event.preventDefault();

    if (withLinkTabIndex !== -1) {
      tabs.forEach((tab, index) => {
        tab.isActive = withLinkTabIndex === index;
      });

      saveTabs(tabs);
      history.push(link);
      this.setState({ tabs });

      return;
    }

    if (isNewTab) {
      tabs.map(tab => {
        tab.isActive = false;
        return tab;
      });

      tabs.push(this.generateNewTab({ link }));
    } else {
      const tab = tabs.find(tab => tab.isActive);

      tab.link = link;
      tab.title = this.getTitle(link) || homepageName;
    }

    saveTabs(tabs);
    history.push(link);

    this.setState({ tabs }, () => {
      const { current } = this.$tabWrapper;

      if (current) {
        if (current.scrollWidth > current.offsetWidth + getScrollbarWidth()) {
          current.scrollLeft = current.scrollWidth;
        }

        this.checkNeedArrow();
      }
    });
  };

  handleCloseTab(tabId, event) {
    const { saveTabs, history } = this.props;
    let { tabs } = this.state;
    const index = tabs.findIndex(tab => tab.id === tabId);

    event.stopPropagation();

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

      history.push(link);
    }

    for (let i = index; i < tabs.length; i++) {
      tabs[i].position -= 1;
    }

    tabs.splice(index, 1);
    saveTabs(tabs);

    this.setState({ tabs }, this.checkNeedArrow.bind(this));
  }

  handleClickTab(tab) {
    if (tab.isActive) {
      return;
    }

    this.activeTab = tab;
  }

  handleAddTab = () => {
    this.setState(
      state => {
        const { history, saveTabs } = this.props;
        const { tabs } = state;
        const newTab = this.generateNewTab.call(this);

        tabs.map(tab => {
          tab.isActive = false;
          return tabs;
        });
        tabs.push(newTab);
        history.push(newTab.link);
        saveTabs(tabs);

        return { tabs };
      },
      () => {
        const { current } = this.$tabWrapper;

        if (current) {
          if (current.scrollWidth > current.offsetWidth + getScrollbarWidth()) {
            current.scrollLeft = current.scrollWidth;
          }

          this.checkNeedArrow();
        }
      }
    );
  };

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

    this.setState({
      draggableNode: node
    });
  };

  handleSortEnd = ({ oldIndex, newIndex }, event) => {
    const { draggableNode } = this.state;

    event.stopPropagation();
    draggableNode.classList.toggle('page-tab__tabs-item_sorting');

    this.setState(state => {
      const { tabs } = state;
      const draggableTab = tabs[oldIndex];

      tabs.splice(oldIndex, 1);
      tabs.splice(newIndex, 0, draggableTab);
      tabs.map((tab, index) => {
        tab.position = index;
        return tab;
      });

      this.props.saveTabs(tabs);

      return { tabs, draggableNode: null };
    });
  };

  get sortableTabs() {
    const { tabs } = this.state;

    return tabs.sort((first, second) => (first.position > second.position ? 1 : -1));
  }

  set activeTab(tab) {
    const { history, saveTabs } = this.props;
    const { tabs } = this.state;

    tabs.map(item => {
      item.isActive = item.id === tab.id;
      return item;
    });

    saveTabs(tabs);
    history.replace(tab.link);

    this.setState({ tabs });
  }

  getTitle(url) {
    let cleanUrl = url.replace(/\?.*/i, '');

    cleanUrl = cleanUrl.replace(/#.*/i, '');

    return getTitleByUrl(cleanUrl);
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

  renderTabItem = item => {
    const { tabs } = this.state;
    const className = ['page-tab__tabs-item'];
    const closeButton =
      tabs.length > 1 ? <div className="page-tab__tabs-item-close icon-close" onClick={this.handleCloseTab.bind(this, item.id)} /> : null;

    if (item.isActive) {
      className.push('page-tab__tabs-item_active');
    }

    return (
      <SortableElement key={item.id} index={item.position} onSortEnd={this.handleSortEnd}>
        <div key={item.id} className={className.join(' ')} title={item.title} onClick={this.handleClickTab.bind(this, item)}>
          <span className="page-tab__tabs-item-title">{item.title}</span>
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
      <div className={className.join(' ')}>
        {this.renderLeftButton()}
        <SortableContainer
          axis="x"
          lockAxis="x"
          distance={3}
          updateBeforeSortStart={this.handleBeforeSortStart}
          onSortEnd={this.handleSortEnd}
        >
          <div className="page-tab__tabs" ref={this.$tabWrapper}>
            {this.sortableTabs.map(this.renderTabItem)}
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
        <div className="page-tab__body">
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
      <React.Fragment>
        {this.renderTabWrapper()}
        {this.renderChildren()}
      </React.Fragment>
    );
  }
}

export default withRouter(PageTabs);
