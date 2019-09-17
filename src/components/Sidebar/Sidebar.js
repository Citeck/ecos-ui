import React from 'react';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';
import { fetchLargeLogoSrc, fetchSlideMenuItems, fetchSmallLogoSrc, toggleIsOpen } from '../../actions/slideMenu';
import ULS from '../../services/userLocalSettings';
import SidebarService from '../../services/sidebar';
import { Icon, Separator } from '../common';
import Logo from './Logo';

import './style.scss';

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen,
  isReady: state.slideMenu.isReady,
  items: state.slideMenu.items,
  smallLogoSrc: state.slideMenu.smallLogo,
  largeLogoSrc: state.slideMenu.largeLogo
});

const mapDispatchToProps = dispatch => ({
  fetchSmallLogoSrc: () => dispatch(fetchSmallLogoSrc()),
  fetchLargeLogoSrc: () => dispatch(fetchLargeLogoSrc()),
  fetchSlideMenuItems: () => dispatch(fetchSlideMenuItems()),
  toggleIsOpen: isOpen => dispatch(toggleIsOpen(isOpen))
});

const isOpenMenu = () => {
  return get(ULS.getMenuMode(), 'isSlideMenuOpen', true);
};

const setOpenMenu = isSlideMenuOpen => {
  ULS.setMenuMode({
    ...ULS.getMenuMode(),
    isSlideMenuOpen
  });
};

class Sidebar extends React.Component {
  slideMenuToggle = null;

  componentDidMount() {
    this.props.fetchSmallLogoSrc();
    this.props.fetchLargeLogoSrc();
    this.props.fetchSlideMenuItems();
    this.props.toggleIsOpen(isOpenMenu());

    this.slideMenuToggle = document.getElementById('slide-menu-toggle');

    if (this.slideMenuToggle) {
      this.slideMenuToggle.addEventListener('click', this.toggleSlideMenu);
    }
  }

  componentWillUnmount() {
    if (this.slideMenuToggle) {
      this.slideMenuToggle.removeEventListener('click', this.toggleSlideMenu);
    }
  }

  toggleSlideMenu = () => {
    const { isOpen } = this.props;

    setOpenMenu(!isOpen);
    this.props.toggleIsOpen(!isOpen);
  };

  render() {
    const { isOpen, isReady, largeLogoSrc, smallLogoSrc, items } = this.props;
    console.log('>>>', items);
    if (!isReady) {
      return null;
    }

    return (
      <div
        className={classNames('ecos-sidebar-inner', {
          'ecos-sidebar-inner_open': isOpen
        })}
      >
        <Logo large={isOpen} logo={isOpen ? largeLogoSrc : smallLogoSrc} />
        {!isOpen && (
          <div className="ecos-sidebar-inner__separator">
            <Separator noIndents />
          </div>
        )}
        <List data={items} level={0} isExpanded />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Sidebar);

class List extends React.Component {
  render() {
    const { data, className, level, isExpanded } = this.props;

    if (isEmpty(data)) {
      return null;
    }

    const LItem = setConfiguration(Item);

    return (
      <ul
        className={classNames('ecos-sidebar-list', `ecos-sidebar-list_lvl-${level}`, {
          'ecos-sidebar-list_collapsed': !isExpanded,
          'ecos-sidebar-list_expanded': isExpanded
        })}
      >
        {data.map(item => (
          <LItem data={item} level={level} />
        ))}
      </ul>
    );
  }
}

class Item extends React.Component {
  state = {
    isExpanded: false
  };

  constructor(props) {
    super(props);

    this.state.isExpanded = props.isExpanded;
  }

  toggleList() {
    const { isExpanded } = this.state;

    this.setState({ isExpanded: !isExpanded });
  }

  render() {
    const { data, level, noIcon, noBadge, noToggle } = this.props;
    const { isExpanded } = this.state;

    if (isEmpty(data)) {
      return null;
    }

    return (
      <li className="ecos-sidebar-item">
        <div className="ecos-sidebar-item__name-wrapper">
          {!noIcon && <Icon className="ecos-sidebar-item__icon icon-empty-icon" />}
          <div className="ecos-sidebar-item__label">{data.label}</div>
          {!noBadge && <div className="ecos-sidebar-item__badge">{level}</div>}
          {/*{!noBadge && <div className="ecos-sidebar-item__point"/>}*/}
          {!noToggle && (
            <Icon
              className={classNames('ecos-sidebar-item__toggle', { 'icon-down': !isExpanded, 'icon-up': isExpanded })}
              onClick={() => this.toggleList()}
            />
          )}
        </div>
        <List isExpanded={isExpanded} data={data.items} level={level + 1} />
      </li>
    );
  }
}

function setConfiguration(WrappedComponent) {
  return class extends React.Component {
    render() {
      const { level, data } = this.props;
      const { items } = data || {};

      const newProps = {
        ...this.props,
        noIcon: SidebarService.styleLevel.noIcon(level),
        noBadge: SidebarService.styleLevel.noBadge(level),
        noToggle: SidebarService.styleLevel.noToggle(level) || isEmpty(items),
        isExpanded: SidebarService.styleLevel.isDefExpanded(level)
      };

      return <WrappedComponent {...newProps} />;
    }
  };
}
