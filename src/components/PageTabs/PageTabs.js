import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { push, replace } from 'connected-react-router';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import ReactResizeDetector from 'react-resize-detector';
import classNames from 'classnames';

import { animateScrollTo, arrayCompare, deepClone, getScrollbarWidth, t } from '../../helpers/util';
import { decodeLink, isNewVersionPage } from '../../helpers/urls';
import { IGNORE_TABS_HANDLER_ATTR_NAME, LINK_TAG, OPEN_IN_BACKGROUND } from '../../constants/pageTabs';
import { addTab, changeTab, deleteTab, initTabs, moveTabs } from '../../actions/pageTabs';
import PageTabList from '../../services/pageTabs/PageTabListService';
import { SortableContainer } from '../Drag-n-Drop';
import Tab from './Tab';

import './style.scss';

const CHANGE_URL_LINK_EVENT = PageTabList.events.CHANGE_URL_LINK_EVENT;
const Labels = {
  GO_HOME: 'header.site-menu.go-home-page'
};

class PageTabs extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    homepageLink: PropTypes.string.isRequired,
    isShow: PropTypes.bool,
    linkIgnoreAttr: PropTypes.string
  };

  static defaultProps = {
    children: null,
    linkIgnoreAttr: IGNORE_TABS_HANDLER_ATTR_NAME
  };

  state = {
    isActiveLeftArrow: false,
    isActiveRightArrow: false,
    needArrow: false,
    draggableNode: null
  };

  inited = false;

  constructor(props) {
    super(props);

    this.$tabWrapper = React.createRef();
  }

  componentDidMount() {
    const { initTabs } = this.props;

    initTabs();
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const { tabs, isShow, inited } = this.props;

    return JSON.stringify(nextProps.tabs) !== JSON.stringify(tabs) || nextProps.isShow !== isShow || nextProps.inited !== inited;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { tabs, isShow, inited } = this.props;
    const activeTabPrev = get(prevProps.tabs.find(tab => tab.isActive), 'id', '');
    const activeTab = get(tabs.find(tab => tab.isActive), 'id', '');

    if (isShow) {
      if (JSON.stringify(prevProps.tabs) !== JSON.stringify(tabs) || !arrayCompare(prevProps.tabs, tabs)) {
        this.checkNeedArrow();
      }

      if (activeTab !== activeTabPrev) {
        this.handleScrollToActiveTab();
      }

      if (isShow && inited && !this.inited) {
        this.init();
      }
    }
  }

  componentWillUnmount() {
    window.clearInterval(this.checkArrowID);
    document.removeEventListener('click', this.handleClickLink);
    document.removeEventListener(CHANGE_URL_LINK_EVENT, this.handleCustomEvent);
    this.checkArrowID = null;
  }

  get wrapper() {
    return get(this.$tabWrapper, 'current', null);
  }

  get elmActiveTab() {
    return this.wrapper.querySelector('.page-tab__tabs-item_active');
  }

  get sizeTab() {
    return this.wrapper.querySelector('.page-tab__tabs-item:not(.page-tab__tabs-item_active)').offsetWidth;
  }

  init() {
    this.inited = true;
    this.initArrows();

    document.addEventListener('click', this.handleClickLink);
    document.addEventListener(CHANGE_URL_LINK_EVENT, this.handleCustomEvent, false);
  }

  initArrows() {
    this.checkArrowID = window.setInterval(() => {
      const wrapper = this.wrapper;

      if (wrapper) {
        this.checkNeedArrow();

        const { left: activeLeft = 0, width: activeWidth = 0 } = this.elmActiveTab ? this.elmActiveTab.getBoundingClientRect() : {};

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
        isActiveRightArrow: scrollWidth > offsetWidth + scrollLeft,
        isActiveLeftArrow: scrollLeft > 0
      });
    }
  }

  closeTab(tab) {
    const { deleteTab, tabs } = this.props;

    if (tabs.length > 1) {
      deleteTab(tab);
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
        openInBackground = false,
        link = ''
      }
    } = event;
    const { isShow, push, addTab } = this.props;
    const tabs = deepClone(this.props.tabs);

    let target = '';

    if (!isShow) {
      push.call(this, link);
      return;
    }

    if (closeActiveTab) {
      const activeIndex = tabs.findIndex(tab => tab.isActive);

      if (activeIndex !== -1) {
        this.closeTab(tabs[activeIndex]);
      }
    }

    event.preventDefault();

    if (openNewBrowserTab) {
      target = '_blank';
    } else if (reopenBrowserTab) {
      target = '_self';
    }

    if (target) {
      const tab = window.open(link, target);

      tab.focus();

      return;
    }

    const data = {
      link,
      isActive: openNewTab
    };

    addTab({ data });
  };

  handleClickLink = event => {
    const { isShow, linkIgnoreAttr } = this.props;

    if (!isShow) {
      return;
    }

    let elem = event.currentTarget;

    if ((!elem || elem.tagName !== LINK_TAG) && event.target) {
      elem = event.target.closest('a[href]');
    }

    if (!elem || elem.tagName !== LINK_TAG || !!elem.getAttribute(linkIgnoreAttr)) {
      return;
    }

    const { addTab } = this.props;
    const link = decodeLink(elem.getAttribute('href'));

    if (!isNewVersionPage(link)) {
      return;
    }

    event.preventDefault();

    const isBackgroundOpening = elem.getAttribute(OPEN_IN_BACKGROUND);
    const data = {
      link,
      isActive: !(isBackgroundOpening || (event.button === 0 && event.ctrlKey))
    };

    addTab({ data });
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
      return;
    }

    this.props.changeTab({ data: { isActive: true }, filter: { id: tab.id } });
  };

  handleAddTab = () => {
    const { addTab, homepageLink } = this.props;

    addTab({ data: { link: homepageLink, isActive: true }, params: { last: true } });
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

      if (scrollLeft === 0) {
        this.setState({
          isActiveLeftArrow: false
        });
      }

      this.setState({
        isActiveRightArrow: true
      });

      animateScrollTo(this.wrapper, { scrollLeft });
      this.checkNeedArrow(scrollLeft);
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
      this.checkNeedArrow(scrollLeft);
    }
  };

  handleScrollToActiveTab = () => {
    const { needArrow } = this.state;
    const wrapper = this.wrapper;

    if (!wrapper || !needArrow) {
      return;
    }

    const { offsetLeft = 0, offsetWidth = 0 } = this.elmActiveTab || {};
    const scrollLeft = offsetLeft - wrapper.offsetWidth / 2 + offsetWidth / 2;

    animateScrollTo(wrapper, { scrollLeft });
    this.checkNeedArrow(scrollLeft);
  };

  handleBeforeSortStart = ({ node }) => {
    node.classList.toggle('page-tab__tabs-item_sorting');

    this.setState({ draggableNode: node });
  };

  handleSortEnd = ({ oldIndex, newIndex }, event) => {
    const { draggableNode } = this.state;

    event.stopPropagation();
    draggableNode.classList.toggle('page-tab__tabs-item_sorting');

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
        <div className="page-tab__tabs-add icon-plus" title={t(Labels.GO_HOME)} onClick={this.handleAddTab} />
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

const mapStateToProps = state => ({
  location: get(state, 'router.location', {}),
  tabs: get(state, ['pageTabs', 'tabs'], []),
  inited: get(state, ['pageTabs', 'inited'], false)
});

const mapDispatchToProps = dispatch => ({
  initTabs: () => dispatch(initTabs()),
  moveTabs: params => dispatch(moveTabs(params)),
  changeTab: tab => dispatch(changeTab(tab)),
  addTab: params => dispatch(addTab(params)),
  deleteTab: tab => dispatch(deleteTab(tab)),
  push: url => dispatch(push(url)),
  replace: url => dispatch(replace(url))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PageTabs);
