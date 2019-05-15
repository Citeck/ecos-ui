import React from 'react';
import * as PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { getScrollbarWidth, deepClone } from '../../helpers/util';
import { SortableContainer, SortableElement } from './sortable';
import { SCROLL_STEP, TITLE } from '../../constants/pageTabs';
import './style.scss';

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

    saveTabs: PropTypes.func
  };

  static defaultProps = {
    children: null,
    homepageName: 'Домашняя страница',
    isShow: false,
    tabs: [],

    saveTabs: () => {}
  };

  state = {
    tabs: [],
    isActiveLeftArrow: false,
    isActiveRightArrow: false,
    needArrow: false
  };

  constructor(props) {
    super(props);

    this.state.tabs = props.tabs;

    this.$tabWrapper = React.createRef();
  }

  componentDidMount() {
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

    document.addEventListener('click', this.handleClickLink);

    const activeTab = this.props.tabs.find(tab => tab.isActive);

    if (activeTab) {
      this.props.history.replace(activeTab.link);
    }
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (nextProps.isShow) {
      if (nextProps.isShow !== this.props.isShow && !nextProps.tabs.length) {
        const tabs = [this.generateNewTab(0, nextProps)];

        nextProps.saveTabs(tabs);

        this.setState({ tabs });
      }

      if (JSON.stringify(nextProps.tabs) !== JSON.stringify(nextState.tabs)) {
        this.setState({ tabs: nextProps.tabs });
      }
    }

    return true;
  }

  componentWillUnmount() {
    window.clearInterval(this.checkArrowID);
    this.checkArrowID = null;
    document.removeEventListener('click', this.handleClickLink);
  }

  generateNewTab(countTabs, props = this.props, link = '') {
    const { homepageLink, homepageName } = props;

    return {
      id: Math.random()
        .toString(36)
        .substring(6),
      position: countTabs,
      isActive: true,
      link: link || homepageLink,
      title: TITLE[link || homepageLink] || homepageName
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

  handleClickLink = event => {
    const { isShow } = this.props;
    const elem = event.target;

    if (!isShow || elem.tagName !== 'A') {
      return;
    }

    const { saveTabs, history, homepageName } = this.props;
    const { tabs } = this.state;
    const link = elem.getAttribute('href');
    const isNewTab = elem.getAttribute('target') === '_blank';

    event.preventDefault();

    if (isNewTab) {
      tabs.map(tab => {
        tab.isActive = false;
        return tab;
      });

      tabs.push(this.generateNewTab(tabs.length, this.props, link));
    } else {
      const tab = tabs.find(tab => tab.isActive);

      tab.link = link;
      tab.title = TITLE[link] || homepageName;
    }

    saveTabs(tabs);

    this.setState({ tabs }, () => {
      const { current } = this.$tabWrapper;

      if (current) {
        if (current.scrollWidth > current.offsetWidth + getScrollbarWidth()) {
          current.scrollLeft = current.scrollWidth;
        }

        this.checkNeedArrow();
      }
    });

    history.push(link);
  };

  handleCloseTab(tabId, event) {
    const { saveTabs, history } = this.props;
    const { tabs } = this.state;
    const index = tabs.findIndex(tab => tab.id === tabId);

    event.stopPropagation();

    if (index === -1) {
      return false;
    }

    let newTabs = deepClone(tabs);

    if (newTabs[index].isActive) {
      let link = '/';

      switch (index) {
        case newTabs.length - 1:
          newTabs[index - 1].isActive = true;
          link = newTabs[index - 1].link;
          break;
        case 0:
          newTabs[index + 1].isActive = true;
          link = newTabs[index + 1].link;
          break;
        default:
          newTabs[index + 1].isActive = true;
          link = newTabs[index + 1].link;
      }

      history.push(link);
    }

    for (let i = index; i < newTabs.length; i++) {
      newTabs[i].position -= 1;
    }

    newTabs.splice(index, 1);
    saveTabs(newTabs);

    this.setState({ tabs: newTabs }, this.checkNeedArrow.bind(this));
  }

  handleSetActiveTab(tab) {
    const { history, saveTabs } = this.props;
    const { tabs } = this.state;

    tabs.map(item => {
      item.isActive = item.id === tab.id;

      return item;
    });

    saveTabs(tabs);

    this.setState({ tabs }, () => {
      history.push(tab.link);
    });
  }

  handleAddTab = () => {
    this.setState(
      state => {
        const tabs = [...state.tabs];
        const newTab = this.generateNewTab(tabs.length);

        tabs.map(tab => {
          tab.isActive = false;

          return tabs;
        });
        tabs.push(newTab);
        this.props.history.push(newTab.link);

        this.props.saveTabs(tabs);

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
      let { scrollLeft } = this.$tabWrapper.current;

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

      this.$tabWrapper.current.scrollLeft = scrollLeft;
    }
  };

  handleScrollRight = () => {
    const { isActiveRightArrow } = this.state;

    if (!isActiveRightArrow) {
      return false;
    }

    if (this.$tabWrapper.current) {
      let { scrollLeft, scrollWidth, clientWidth } = this.$tabWrapper.current;

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

      this.$tabWrapper.current.scrollLeft = scrollLeft;
    }
  };

  handleSortEnd = ({ oldIndex, newIndex }, event) => {
    event.stopPropagation();

    this.setState(state => {
      const tabs = deepClone(state.tabs);
      const draggableTab = tabs[oldIndex];

      tabs.splice(oldIndex, 1);
      tabs.splice(newIndex, 0, draggableTab);
      tabs.map((tab, index) => {
        tab.position = index;
        return tab;
      });

      this.props.saveTabs(tabs);

      return { tabs };
    });
  };

  get sortableTabs() {
    const { tabs } = this.state;

    return tabs.sort((first, second) => {
      return first.position > second.position ? 1 : -1;
    });
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
        <div key={item.id} className={className.join(' ')} title={item.title} onClick={this.handleSetActiveTab.bind(this, item)}>
          <span className="page-tab__tabs-item-title">{item.title}</span>
          {closeButton}
        </div>
      </SortableElement>
    );
  };

  renderTabs() {
    return (
      <div className="page-tab__tabs" ref={this.$tabWrapper}>
        {this.sortableTabs.map(tab => this.renderTabItem(tab))}
      </div>
    );
  }

  renderTabWrapper() {
    const { isShow } = this.props;
    const { tabs, isActiveRightArrow, needArrow } = this.state;

    if (!tabs.length || !isShow) {
      return null;
    }

    const className = ['page-tab'];

    if (isActiveRightArrow && needArrow) {
      className.push('page-tab_with-scroll');
    }

    return (
      <div className={className.join(' ')}>
        {this.renderLeftButton()}
        <SortableContainer axis={'x'} lockAxis={'x'} distance={3} onSortEnd={this.handleSortEnd}>
          {this.renderTabs()}
        </SortableContainer>
        <div className="page-tab__tabs-add icon-plus" onClick={this.handleAddTab} />
        {this.renderRightButton()}
      </div>
    );
  }

  renderChildren() {
    const { children, isShow } = this.props;

    if (isShow) {
      return <div className="page-tab__body">{children}</div>;
    }

    return children;
  }

  render() {
    return (
      <React.Fragment>
        {this.renderTabWrapper()}
        {this.renderChildren()}
        <a href="/share/page/journals">Журнал на этой странице</a>
        <br />
        <a href="/share/page/journalsDashboard" target="_blank">
          Журнал дашборд на новой странице
        </a>
      </React.Fragment>
    );
  }
}

export default withRouter(PageTabs);
