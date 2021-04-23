import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';

import { t } from '../../helpers/util';
import { DropdownMenu as Menu } from '../common';
import { IcoBtn } from '../common/btns';

const mapStateToProps = state => ({
  items: state.header.createCaseWidget.items,
  isLoading: state.header.createCaseWidget.isLoading,
  isCascade: state.header.createCaseWidget.isCascade,
  theme: state.view.theme
});

const Labels = {
  BTN_LABEL: 'header.menu.create.btn.label',
  EMPTY: 'header.menu.msg.empty-list',
  LOADING: 'header.menu.msg.loading'
};

class CreateMenu extends React.Component {
  static propTypes = {
    isMobile: PropTypes.bool
  };

  static defaultProps = {
    isMobile: false
  };

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
    const { items, isLoading, isCascade, isMobile, theme } = this.props;
    const mode = isCascade && !isMobile ? 'cascade' : 'group';

    return (
      <Dropdown className="ecos-header-create ecos-header-dropdown" isOpen={dropdownOpen} toggle={this.toggle}>
        <DropdownToggle tag="div">
          <IcoBtn
            icon={'icon-small-plus'}
            className={classNames('ecos-header-create__btn ecos-btn_padding_small ecos-btn_r_6 ecos-btn_blue-classic', {
              [`ecos-btn_theme_${theme}`]: !!theme
            })}
          >
            {!isMobile && t(Labels.BTN_LABEL)}
          </IcoBtn>
        </DropdownToggle>
        <DropdownMenu
          className={classNames('ecos-header-create__menu', 'ecos-dropdown__menu', 'ecos-dropdown__menu_links', {
            'ecos-dropdown__menu_cascade': isCascade
          })}
        >
          <Menu
            items={items}
            mode={mode}
            setCascade={{ collapseOneItem: true }}
            emptyMessage={isLoading ? t(Labels.LOADING) : t(Labels.EMPTY)}
          />
        </DropdownMenu>
      </Dropdown>
    );
  }
}

export default connect(mapStateToProps)(CreateMenu);
