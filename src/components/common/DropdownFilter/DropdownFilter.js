import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { t } from '../../../helpers/util';
import { Dropdown } from '../form';
import { IcoBtn } from '../btns';
import FilterItem from './FilterItem';

import './style.scss';

export default class DropdownFilter extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    columns: PropTypes.array,
    onFilter: PropTypes.func
  };

  static defaultProps = {
    className: '',
    columns: [],
    onFilter: () => null
  };

  state = {
    isOpenFilter: false,
    arrayField: []
  };

  className = 'ecos-dropdown-filter';

  handleFilter = field => {
    console.info(field);
  };

  getStateOpen = isOpenFilter => {
    this.setState({ isOpenFilter });
  };

  render() {
    const { isOpenFilter } = this.state;
    const { columns, className } = this.props;
    const all = [{ dataField: 'all-fields', text: t('dropdown-filter.all-fields') }];

    return (
      <div className={className + '-wrapper'}>
        <Dropdown
          isStatic
          source={all.concat(columns)}
          valueField={'dataField'}
          titleField={'text'}
          getStateOpen={this.getStateOpen}
          onChange={this.handleFilter}
          CustomItem={FilterItem}
          className={classNames(this.className, className)}
          full
        >
          <IcoBtn invert icon={isOpenFilter ? 'icon-small-up' : 'icon-small-down'} className={`ecos-btn_full-width ecos-btn_drop-down`}>
            {t('dropdown-filter.icon-button.label')}
          </IcoBtn>
        </Dropdown>
      </div>
    );
  }
}
