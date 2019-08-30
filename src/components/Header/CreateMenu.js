import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isArray, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { IcoBtn } from '../common/btns';
import { DropdownMenu as Menu } from '../common';
import { t } from '../../helpers/util';

const mapStateToProps = state => ({
  items: state.header.createCaseWidget.items,
  isCascade: state.header.createCaseWidget.isCascade
});

class CreateMenu extends React.Component {
  static propTypes = {
    isMobile: PropTypes.bool
  };

  static defaultProps = {
    isMobile: false
  };

  className = 'ecos-header-create';

  state = {
    dropdownOpen: false
  };

  toggle = () => {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  };

  render() {
    const { dropdownOpen } = this.state;
    const { items, isCascade, isMobile } = this.props;
    const disabled = !(!isEmpty(items) && isArray(items));
    const classNameMenu = classNames(`${this.className}__menu ecos-dropdown__menu ecos-dropdown__menu_links`, {
      'ecos-dropdown__menu_cascade': isCascade
    });
    const classNameIcoBtn = classNames(
      `${this.className}__btn ecos-btn_blue ecos-btn_hover_t-blue ecos-btn_padding_small ecos-btn_r_6`,
      { 'ecos-btn_active_blue': dropdownOpen },
      { 'ecos-btn_active_blue2': !dropdownOpen }
    );
    const mode = isCascade && !isMobile ? 'cascade' : 'group';

    return (
      <Dropdown className={`${this.className} ecos-header-dropdown`} isOpen={dropdownOpen} toggle={this.toggle}>
        <DropdownToggle tag="div">
          <IcoBtn icon={'icon-big-plus'} className={classNameIcoBtn} disabled={disabled}>
            {!isMobile && t('create_case.label')}
          </IcoBtn>
        </DropdownToggle>
        <DropdownMenu className={classNameMenu}>
          <Menu items={items} mode={mode} setCascade={{ collapseOneItem: true }} />
        </DropdownMenu>
      </Dropdown>
    );
  }
}

export default connect(mapStateToProps)(CreateMenu);
