import React from 'react';
import PropTypes from 'prop-types';
import { isArray, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { IcoBtn } from '../../common/btns';
import DropDownMenuGroup from '../DropdownMenuGroup';
import DropdownMenuCascade from '../DropdownMenuCascade';
import { isMobileDevice, t } from '../../../helpers/util';

import '../style.scss';
import '../../common/form/Dropdown/Dropdown.scss';

const mapStateToProps = state => ({
  items: state.header.createCaseWidget.items,
  isCascade: state.header.createCaseWidget.isCascade
});

class CreateCaseBtn extends React.Component {
  static propTypes = {
    isSmallMode: PropTypes.bool
  };

  static defaultProps = {
    isSmallMode: false
  };

  renderMenuListItems() {
    const { items, isCascade } = this.props;

    return items.map((item, key) => {
      return isCascade ? (
        <DropdownMenuCascade key={key} label={item.label} items={item.items} id={item.id} />
      ) : (
        <DropDownMenuGroup key={key} label={item.label} items={item.items} id={item.id} hideLabel={true} hideSeparator={true} />
      );
    });
  }

  render() {
    const { items, isCascade, isSmallMode } = this.props;
    const disabled = !(!isEmpty(items) && isArray(items));

    return (
      <div className={'ecos-create-case__container'}>
        <UncontrolledDropdown>
          <DropdownToggle tag="IcoBtn">
            <IcoBtn
              icon={'icon-plus'}
              className={'ecos-create-case__btn ecos-btn_blue ecos-btn_hover_t-blue ecos-btn_tight ecos-btn_x-step_10'}
              invert={false}
              title={t('create_case.label')}
              disabled={disabled}
            >
              {!(isSmallMode || isMobileDevice()) && t('create_case.label')}
            </IcoBtn>
          </DropdownToggle>
          <DropdownMenu className={'ecos-create-case__menu ecos-dropdown__menu'}>{!disabled && this.renderMenuListItems()}</DropdownMenu>
        </UncontrolledDropdown>
      </div>
    );
  }
}

export default connect(mapStateToProps)(CreateCaseBtn);
