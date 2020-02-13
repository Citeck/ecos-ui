import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { push, replace } from 'connected-react-router';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import ReactResizeDetector from 'react-resize-detector';
import classNames from 'classnames';

import { animateScrollTo, arrayCompare, getScrollbarWidth, t } from '../../helpers/util';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../constants/pageTabs';
import { addTab, changeTab, deleteTab, initTabs, moveTabs, setDisplayState } from '../../actions/pageTabs';
import PageTabList from '../../services/pageTabs/PageTabListService';
import { SortableContainer } from '../Drag-n-Drop';
import ClickOutside from '../ClickOutside';
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
    linkIgnoreAttr: PropTypes.string,
    isShow: PropTypes.bool
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
  initedScroll = false;

  constructor(props) {
    super(props);

    this.$tabWrapper = React.createRef();
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
        if (activeTab !== activeTabPrev || !this.initedScroll) {
          this.initedScroll = true;
          this.handleScrollToActiveTab();
        } else if (!arrayCompare(prevProps.tabs, tabs)) {
          this.checkNeedArrow();
        }
      }
    }
  }

  componentWillUnmount() {
    document.removeEventListener(CHANGE_URL_LINK_EVENT, this.handleCustomEvent);
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
    this.handleScrollToActiveTab();
    document.addEventListener(CHANGE_URL_LINK_EVENT, this.handleCustomEvent, false);
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

  closeTab(tab) {
    const { deleteTab } = this.props;

    deleteTab(tab);
  }

  handleCustomEvent = event => {
    const {
      params: { link = '' }
    } = event;
    const { isShow, push, addTab } = this.props;

    if (!isShow) {
      push.call(this, link);
      return;
    }

    addTab({ params: { event } });
  };

  handleClickLink = event => {
    const { isShow, linkIgnoreAttr, addTab } = this.props;

    if (!isShow) {
      return;
    }

    addTab({ params: { event, linkIgnoreAttr } });
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
    const wrapper = this.wrapper;

    if (!wrapper || !needArrow) {
      return;
    }

    const { left: tLeft } = this.elmActiveTab ? this.elmActiveTab.getBoundingClientRect() : {};
    const { left: wLeft } = this.elmActiveTab ? this.wrapper.getBoundingClientRect() : {};

    animateScrollTo(wrapper, { scrollLeft: tLeft - wLeft });
    this.checkNeedArrow();
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
  tabs: get(state, 'pageTabs.tabs', []),
  inited: get(state, 'pageTabs.inited', false)
});

const mapDispatchToProps = dispatch => ({
  initTabs: () => dispatch(initTabs()),
  moveTabs: params => dispatch(moveTabs(params)),
  setDisplayState: state => dispatch(setDisplayState(state)),
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
