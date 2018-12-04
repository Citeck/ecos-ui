import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import LogoBlock from './LogoBlock';
import RootList from './RootList';
import './slide-menu.css';
import { fetchSmallLogoSrc, fetchLargeLogoSrc, fetchSlideMenuItems, toggleIsOpen } from '../../actions/slideMenu';
import { t } from '../../helpers/util';

const mapStateToProps = state => ({
  isOpen: state.slideMenu.isOpen
});

const mapDispatchToProps = dispatch => ({
  fetchSmallLogoSrc: () => {
    dispatch(fetchSmallLogoSrc());
  },
  fetchLargeLogoSrc: () => {
    dispatch(fetchLargeLogoSrc());
  },
  fetchSlideMenuItems: () => {
    dispatch(fetchSlideMenuItems());
  },
  toggleIsOpen: isOpen => dispatch(toggleIsOpen(isOpen))
});

class SlideMenu extends React.Component {
  constructor(props) {
    super(props);

    this.checkbox = document.createElement('input');
    this.checkbox.id = 'slide-menu-checkbox';
    this.checkbox.type = 'checkbox';

    this.menu = document.createElement('div');
    this.menu.classList.add('slide-menu');

    this.mask = document.createElement('div');
    this.mask.classList.add('slide-menu-mask');

    const maskLabel = document.createElement('label');
    maskLabel.setAttribute('for', 'slide-menu-checkbox');
    this.mask.appendChild(maskLabel);
  }

  componentDidMount() {
    const theFirstChild = document.body.firstChild;
    document.body.insertBefore(this.checkbox, theFirstChild);
    document.body.insertBefore(this.menu, theFirstChild);
    document.body.insertBefore(this.mask, theFirstChild);

    this.checkbox.addEventListener('change', this.onCheckboxChange);

    this.props.fetchSmallLogoSrc();
    this.props.fetchLargeLogoSrc();
    this.props.fetchSlideMenuItems();
  }

  componentWillUnmount() {
    this.checkbox.removeEventListener('change', this.onCheckboxChange);

    document.body.removeChild(this.checkbox);
    document.body.removeChild(this.menu);
    document.body.removeChild(this.mask);
  }

  onCheckboxChange = e => {
    this.props.toggleIsOpen(e.target.checked);
  };

  toggleSlideMenu = () => {
    this.slideMenuToggle && this.slideMenuToggle.click();
  };

  render() {
    const { isOpen } = this.props;
    const toggleHandleTitle = isOpen ? '' : t('slide_menu_click_to_open.label');

    return ReactDOM.createPortal(
      <Fragment>
        <label
          ref={el => (this.slideMenuToggle = el)}
          className="slide-menu-toggle"
          htmlFor="slide-menu-checkbox"
          title={toggleHandleTitle}
        />
        <LogoBlock />
        <RootList toggleSlideMenu={this.toggleSlideMenu} />
      </Fragment>,
      this.menu
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SlideMenu);
