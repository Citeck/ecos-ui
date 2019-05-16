import React from 'react';
import * as PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { getScrollbarWidth } from '../../helpers/util';
import { SortableContainer, SortableElement } from './sortable';
import { SCROLL_STEP, getTitle } from '../../constants/pageTabs';
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
    this.checkUrls();
    this.initArrows();

    document.addEventListener('click', this.handleClickLink);
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

  componentWillUnmount() {
    window.clearInterval(this.checkArrowID);
    this.checkArrowID = null;
    document.removeEventListener('click', this.handleClickLink);
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
          this.handleSetActiveTab(newActiveTab);
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
      title: getTitle(link || homepageLink) || homepageName
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

      tabs.push(this.generateNewTab({ link }));
    } else {
      const tab = tabs.find(tab => tab.isActive);

      tab.link = link;
      tab.title = getTitle(link) || homepageName;
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

  handleSetActiveTab(tab) {
    const { history, saveTabs } = this.props;
    const { tabs } = this.state;

    tabs.map(item => {
      item.isActive = item.id === tab.id;
      return item;
    });

    saveTabs(tabs);
    history.push(tab.link);

    this.setState({ tabs });
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

  handleSortEnd = ({ oldIndex, newIndex }, event) => {
    event.stopPropagation();

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

      return { tabs };
    });
  };

  get sortableTabs() {
    const { tabs } = this.state;

    return tabs.sort((first, second) => (first.position > second.position ? 1 : -1));
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
        <SortableContainer axis="x" lockAxis="x" distance={3} onSortEnd={this.handleSortEnd}>
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
