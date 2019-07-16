import React from 'react';
import PropTypes from 'prop-types';
import { isArray, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';
import { IcoBtn } from '../common/btns';
import CustomDropdownMenu from '../common/DropdownMenu';
import { t } from '../../helpers/util';

const mapStateToProps = state => ({
  items: state.header.createCaseWidget.items,
  isCascade: state.header.createCaseWidget.isCascade
});

class CreateMenu extends React.Component {
  static propTypes = {
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool
  };

  static defaultProps = {
    isSmallMode: false,
    isMobile: false
  };

  className = 'ecos-header-create';

  render() {
    const { items, isCascade, isSmallMode, isMobile } = this.props;
    const disabled = !(!isEmpty(items) && isArray(items));

    return (
      <div className={`${this.className}__container`}>
        <UncontrolledDropdown className={`ecos-header-dropdown`}>
          <DropdownToggle tag="div">
            <IcoBtn
              icon={'icon-plus'}
              className={`${this.className}__btn ecos-btn_blue ecos-btn_hover_t-blue ecos-btn_tight`}
              invert={false}
              disabled={disabled}
            >
              {!(isSmallMode || isMobile) && t('create_case.label')}
            </IcoBtn>
          </DropdownToggle>
          <DropdownMenu className={`${this.className}__menu ecos-dropdown__menu`}>
            <CustomDropdownMenu items={items} isCascade={isCascade} isGroup={!isCascade} />
          </DropdownMenu>
        </UncontrolledDropdown>
      </div>
    );
  }
}

export default connect(mapStateToProps)(CreateMenu);
