import React from 'react';
import * as PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { getScrollbarWidth } from '../../helpers/util';
import * as ls from '../../helpers/ls';
import { SortableContainer, SortableElement } from './sortable';
import './style.scss';

const SCROLL_STEP = 150;
const lsKey = ls.generateKey('page-tabs', true);

class PageTabs extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }),
    tabs: PropTypes.array,
    homepageLink: PropTypes.string.isRequired,
    homepageName: PropTypes.string
  };

  static defaultProps = {
    children: null,
    homepageName: 'Домашняя страница',
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
    tabs: [],
    isActiveLeftArrow: false,
    isActiveRightArrow: false,
    needArrow: false,
    isShow: false
  };

  constructor(props) {
    super(props);

    let tabs = ls.hasData(lsKey, 'array') ? ls.getData(lsKey) : [this.generateNewTab(0, props)];

    this.state.tabs = tabs;
    this.saveOnLS(tabs);

    this.$tabWrapper = React.createRef();
  }

  componentDidMount() {
    // ToDo: get config of tabs visibility
    window.Citeck.Records.queryOne(
      {
        query: {
          key: 'tabs-enabled'
        },
        sourceId: 'uiserv/config'
      },
      '.bool',
      true
    ).then(isShow => {
      this.setState({ isShow });
    });

    this.checkArrowID = window.setInterval(() => {
      const { current } = this.$tabWrapper;

      if (current) {
        this.checkNeedArrow();

        const { left: wrapLeft, width: wrapWidth } = current.getBoundingClientRect();
        const { left: activeLeft, width: activeWidth } = current.querySelector('.page-tab__tabs-item_active').getBoundingClientRect();

        current.scrollLeft = activeLeft - activeWidth / 2 - getScrollbarWidth() - wrapWidth / 2;

        this.setState({
          isActiveRightArrow: current.scrollWidth - current.scrollLeft - current.offsetWidth > 0,
          isActiveLeftArrow: activeLeft !== wrapLeft
        });

        window.clearInterval(this.checkArrowID);
        this.checkArrowID = null;
      }
    }, 300);

    document.addEventListener('click', this.handleClickLink);
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
      title: homepageName
    };
  }

  checkNeedArrow() {
    if (this.$tabWrapper.current) {
      const { scrollWidth, offsetWidth, scrollLeft } = this.$tabWrapper.current;
      const needArrow = scrollWidth > offsetWidth + getScrollbarWidth();

      this.setState({
        needArrow,
        isActiveRightArrow: scrollWidth > offsetWidth + scrollLeft,
        isActiveLeftArrow: scrollLeft > 0
      });
    }
  }

  saveOnLS(tabs = this.state.tabs) {
    ls.setData(lsKey, tabs);
  }

  handleClickLink = event => {
    const { isShow } = this.state;
    const elem = event.target;

    if (!isShow || elem.tagName !== 'A') {
      return;
    }

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
    }

    tabs.find(tab => tab.isActive).link = link;

    this.setState({ tabs }, () => {
      const { current } = this.$tabWrapper;

      this.saveOnLS();

      if (current) {
        if (current.scrollWidth > current.offsetWidth + getScrollbarWidth()) {
          current.scrollLeft = current.scrollWidth;
        }

        this.checkNeedArrow();
      }
    });
    this.props.history.push(link);
  };

  handleCloseTab(tabId, event) {
    const { tabs } = this.state;
    const index = tabs.findIndex(tab => tab.id === tabId);

    event.stopPropagation();

    if (index === -1) {
      return false;
    }

    let newTabs = [...tabs];

    if (newTabs[index].isActive) {
      switch (index) {
        case newTabs.length - 1:
          newTabs[index - 1].isActive = true;
          break;
        case 0:
          newTabs[index + 1].isActive = true;
          break;
        default:
          newTabs[index + 1].isActive = true;
      }
    }

    for (let i = index; i < newTabs.length; i++) {
      newTabs[i].position -= 1;
    }

    newTabs.splice(index, 1);

    this.saveOnLS(newTabs);

    this.setState(
      {
        tabs: newTabs
      },
      this.checkNeedArrow.bind(this)
    );
  }

  handleSetActiveTab(tab) {
    const { history } = this.props;
    const { tabs } = this.state;

    tabs.map(item => {
      item.isActive = item.id === tab.id;

      return item;
    });

    this.saveOnLS(tabs);

    this.setState({ tabs }, () => {
      history.push(tab.link);
    });
  }

  handleAddTab = () => {
    this.setState(
      state => {
        const tabs = [...state.tabs];

        tabs.map(tab => {
          tab.isActive = false;

          return tabs;
        });
        tabs.push(this.generateNewTab(tabs.length));
        this.saveOnLS(tabs);

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
      const tabs = JSON.parse(JSON.stringify(state.tabs));
      const draggableTab = tabs[oldIndex];

      tabs.splice(oldIndex, 1);
      tabs.splice(newIndex, 0, draggableTab);
      tabs.map((tab, index) => {
        tab.position = index;
        return tab;
      });

      this.saveOnLS(tabs);

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
    const { tabs, isActiveRightArrow, isShow, needArrow } = this.state;

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
    const { children } = this.props;
    const { isShow } = this.state;

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
        <a href="/share/page/journals">On this tab</a>
        <br />
        <a href="/share/page/journalsDashboard" target="_blank">
          On new tab
        </a>
      </React.Fragment>
    );
  }
}

export default withRouter(PageTabs);
