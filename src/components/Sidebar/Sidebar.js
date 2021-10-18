import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';

import { collapseAllItems, fetchSlideMenuItems, getSiteDashboardEnable, setExpandableItems, toggleIsOpen } from '../../actions/slideMenu';
import { isExistValue } from '../../helpers/util';
import { SourcesId } from '../../constants';
import Records from '../Records';
import Logo from './Logo';
import List from './List';
import { selectActiveThemeImage } from '../../selectors/view';
import { DefaultImages } from '../../constants/theme';

import './style.scss';

class Sidebar extends React.Component {
  slideMenuToggle = null;

  state = {
    fetchItems: false
  };

  componentDidMount() {
    const { getSiteDashboardEnable, idMenu } = this.props;
    let record = idMenu.replace(SourcesId.RESOLVED_MENU, SourcesId.MENU);

    if (record.indexOf(SourcesId.MENU) !== 0) {
      record = `${SourcesId.MENU}@${record}`;
    }

    getSiteDashboardEnable();
    this.fetchItems();

    this.slideMenuToggle = document.getElementById('slide-menu-toggle');
    this.recordMenu = Records.get(record);
    this.updateWatcher = this.recordMenu.watch('subMenu.left?json', () => {
      this.fetchItems(true);
    });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.fetchItems();

    if (!prevProps.isReady && this.props.isReady && this.slideMenuToggle) {
      this.slideMenuToggle.addEventListener('click', this.toggleSlideMenu);
    }
  }

  componentWillUnmount() {
    if (this.slideMenuToggle) {
      this.slideMenuToggle.removeEventListener('click', this.toggleSlideMenu);
    }

    this.recordMenu && this.updateWatcher && this.recordMenu.unwatch(this.updateWatcher);
  }

  fetchItems(force) {
    if ((isExistValue(this.props.versionMenu) && !this.state.fetchItems) || force) {
      this.setState({ fetchItems: true }, () => {
        this.props.fetchSlideMenuItems();
      });
    }
  }

  toggleSlideMenu = () => {
    const isOpen = this.props.isOpen;

    this.props.toggleIsOpen(!isOpen);

    if (isOpen) {
      this.props.collapseAllItems();
    } else {
      this.props.setExpandableItems(true);
    }
  };

  render() {
    const { isOpen, isReady, largeLogoSrc, smallLogoSrc, items, homeLink, id } = this.props;

    if (!isReady) {
      return null;
    }

    return (
      <div
        id={id}
        className={classNames('ecos-sidebar', {
          'ecos-sidebar_expanded': isOpen,
          'ecos-sidebar_collapsed': !isOpen
        })}
      >
        <div className={classNames('ecos-sidebar-head', { 'ecos-sidebar-head_expanded': isOpen })}>
          <Logo large={isOpen} logos={{ large: largeLogoSrc, small: smallLogoSrc }} link={homeLink} />
        </div>
        <Scrollbars
          style={{ height: '100%' }}
          className="ecos-sidebar-scroll"
          autoHide
          renderTrackVertical={props => <div {...props} className="ecos-sidebar-scroll-v" />}
          renderTrackHorizontal={() => <div hidden />}
          renderView={props => <div {...props} className="ecos-sidebar-scroll-area" />}
        >
          <List items={items} isExpanded />
        </Scrollbars>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  idMenu: get(state, 'menu.id', ''),
  versionMenu: get(state, 'menu.version'),
  isOpen: get(state, 'slideMenu.isOpen'),
  isReady: get(state, 'slideMenu.isReady'),
  items: get(state, 'slideMenu.items', []),
  smallLogoSrc: selectActiveThemeImage(state, DefaultImages.MENU_LEFT_LOGO_SMALL),
  largeLogoSrc: selectActiveThemeImage(state, DefaultImages.MENU_LEFT_LOGO_LARGE),
  expandableItems: get(state, 'slideMenu.expandableItems'),
  homeLink: get(state, 'app.homeLink')
});

const mapDispatchToProps = dispatch => ({
  fetchSlideMenuItems: () => dispatch(fetchSlideMenuItems()),
  toggleIsOpen: isOpen => dispatch(toggleIsOpen(isOpen)),
  getSiteDashboardEnable: () => dispatch(getSiteDashboardEnable()),
  setExpandableItems: force => dispatch(setExpandableItems({ force })),
  collapseAllItems: () => dispatch(collapseAllItems())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Sidebar);
