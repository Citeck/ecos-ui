import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';

import { performAction } from '../../actions/slideMenu';
import { t } from '../../helpers/util';
import { EcosDropdownMenu } from '../common';
import { IcoBtn } from '../common/btns';

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
    this.setState(prevState => ({ dropdownOpen: !prevState.dropdownOpen }));
  };

  onClickItem = data => {
    this.props.performAction(data);
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
          className={classNames('ecos-header-create__menu ecos-dropdown__menu ecos-dropdown__menu_links', {
            'ecos-dropdown__menu_cascade': isCascade
          })}
        >
          <EcosDropdownMenu
            items={items}
            mode={mode}
            setCascade={{ collapseOneItem: true }}
            emptyMessage={isLoading ? t(Labels.LOADING) : t(Labels.EMPTY)}
            onClick={this.onClickItem}
          />
        </DropdownMenu>
      </Dropdown>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  performAction: data => dispatch(performAction(data))
});

const mapStateToProps = state => ({
  items: state.header.createCaseWidget.items,
  isLoading: state.header.createCaseWidget.isLoading,
  isCascade: state.header.createCaseWidget.isCascade,
  theme: state.view.theme
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateMenu);
