import React from 'react';
import { connect } from 'react-redux';
import LogoBlock from './LogoBlock';
import RootList from './RootList';
import { fetchLargeLogoSrc, fetchSlideMenuItems, fetchSmallLogoSrc, toggleIsOpen } from '../../actions/slideMenu';
import { t } from '../../helpers/util';

import './style.scss';

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen,
  isReady: state.slideMenu.isReady
});

const mapDispatchToProps = dispatch => ({
  fetchSmallLogoSrc: () => dispatch(fetchSmallLogoSrc()),
  fetchLargeLogoSrc: () => dispatch(fetchLargeLogoSrc()),
  fetchSlideMenuItems: () => dispatch(fetchSlideMenuItems()),
  toggleIsOpen: isOpen => dispatch(toggleIsOpen(isOpen))
});

class SlideMenu extends React.Component {
  componentDidMount() {
    this.props.fetchSmallLogoSrc();
    this.props.fetchLargeLogoSrc();
    this.props.fetchSlideMenuItems();
  }

  onCheckboxChange = e => {
    this.props.toggleIsOpen(e.target.checked);
  };

  toggleSlideMenu = () => {
    this.slideMenuToggle && this.slideMenuToggle.click();
  };

  render() {
    const { isOpen, isReady } = this.props;

    if (!isReady) {
      return null;
    }

    const toggleHandleTitle = isOpen ? '' : t('slide_menu_click_to_open.label');

    return (
      <div className="slide-menu slide-menu_open">
        <label
          ref={el => (this.slideMenuToggle = el)}
          className="slide-menu-toggle"
          htmlFor="slide-menu-checkbox"
          title={toggleHandleTitle}
        />
        <LogoBlock />
        <RootList toggleSlideMenu={this.toggleSlideMenu} />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SlideMenu);
