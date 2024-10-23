import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';

import {
  collapseAllItems,
  fetchSlideMenuItems,
  getSiteDashboardEnable,
  setExpandableItems,
  setInitialSelectedId,
  toggleIsOpen
} from '../../actions/slideMenu';
import { isExistValue } from '../../helpers/util';
import { SourcesId } from '../../constants';
import Records from '../Records';
import Logo from './Logo';
import List from './List';
import { selectActiveThemeImage, selectIsViewNewJournal } from '../../selectors/view';
import { DefaultImages } from '../../constants/theme';
import { Events } from '../../services/PageService';

import './style.scss';

class Sidebar extends React.Component {
  static propTypes = {
    idMenu: PropTypes.string,
    versionMenu: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    isOpen: PropTypes.bool,
    isReady: PropTypes.bool,
    items: PropTypes.array,
    smallLogoSrc: PropTypes.string,
    largeLogoSrc: PropTypes.string,
    expandableItems: PropTypes.array,
    homeLink: PropTypes.string,
    locationKey: PropTypes.string,

    fetchSlideMenuItems: PropTypes.func,
    toggleIsOpen: PropTypes.func,
    getSiteDashboardEnable: PropTypes.func,
    setExpandableItems: PropTypes.func,
    collapseAllItems: PropTypes.func,
    setInitialSelectedId: PropTypes.func
  };

  slideMenuToggle = null;

  state = {
    fetchItems: false
  };

  componentDidMount() {
    this.init();
    document.addEventListener(Events.CHANGE_URL_LINK_EVENT, this.props.setInitialSelectedId);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isReady, idMenu } = this.props;
    this.fetchItems();

    if (!prevProps.isReady && isReady && this.slideMenuToggle) {
      this.slideMenuToggle.addEventListener('click', this.toggleSlideMenu);
    }

    if (prevProps.idMenu !== idMenu) {
      this.reInit();
    }
  }

  componentWillUnmount() {
    this.cleanUp();
    document.removeEventListener(Events.CHANGE_URL_LINK_EVENT, this.props.setInitialSelectedId);
  }

  scrollToActiveItem = () => {
    const item = document.getElementsByClassName('ecos-sidebar-item_selected')[0];
    item &&
      item.scrollIntoView({
        block: 'center'
      });
  };

  init(forceFetching = false) {
    const { getSiteDashboardEnable, idMenu, setInitialSelectedId } = this.props;
    let record = idMenu.replace(SourcesId.RESOLVED_MENU, SourcesId.MENU);

    if (record.indexOf(SourcesId.MENU) !== 0) {
      record = `${SourcesId.MENU}@${record}`;
    }

    getSiteDashboardEnable();
    this.fetchItems(forceFetching);

    this.slideMenuToggle = document.getElementById('slide-menu-toggle');
    this.recordMenu = Records.get(record);
    this.updateWatcher = this.recordMenu.watch('subMenu.left?json', () => {
      this.fetchItems(true);
    });

    setInitialSelectedId();
  }

  reInit() {
    this.cleanUp();
    this.init(true);
  }

  cleanUp() {
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

    this.scrollToActiveItem();
  };

  render() {
    const { isOpen, isReady, largeLogoSrc, smallLogoSrc, items, homeLink, id, isViewNewJournal } = this.props;

    if (!isReady) {
      return null;
    }

    return (
      <div
        id={id}
        className={classNames('ecos-sidebar', {
          'ecos-sidebar_expanded': isOpen,
          'ecos-sidebar_collapsed': !isOpen,
          'ecos-sidebar_new': isViewNewJournal,
          'ecos-sidebar_new_expanded': isViewNewJournal && isOpen,
          'ecos-sidebar_new_collapsed': isViewNewJournal && !isOpen
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
  homeLink: get(state, 'app.homeLink'),
  locationKey: get(state, 'router.location.key'),
  isViewNewJournal: selectIsViewNewJournal(state)
});

const mapDispatchToProps = dispatch => ({
  fetchSlideMenuItems: () => dispatch(fetchSlideMenuItems()),
  toggleIsOpen: isOpen => dispatch(toggleIsOpen(isOpen)),
  getSiteDashboardEnable: () => dispatch(getSiteDashboardEnable()),
  setExpandableItems: force => dispatch(setExpandableItems({ force })),
  collapseAllItems: () => dispatch(collapseAllItems()),
  setInitialSelectedId: () => dispatch(setInitialSelectedId())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Sidebar);
