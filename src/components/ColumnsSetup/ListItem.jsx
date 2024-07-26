import React, { Component } from 'react';

import { handleCloseMenuOnScroll } from '../../helpers/util';
import { t } from '../../helpers/export/util';
import ZIndex from '../../services/ZIndex';
import Columns from '../common/templates/Columns/Columns';
import Checkbox from '../common/form/Checkbox';
import Label from '../common/form/Label';
import Select from '../common/form/Select';

import './ColumnsSetup.scss';

export default class ListItem extends Component {
  sortTypes = [{ title: t('columns-setup.ascending'), value: true }, { title: t('columns-setup.descending'), value: false }];

  handleChangeVisible = ({ checked }) => {
    const { onChangeVisible, column } = this.props;

    if (typeof onChangeVisible === 'function') {
      onChangeVisible({ column, checked });
    }
  };

  handleChangeSortBy = data => {
    const { onChangeSortBy, column } = this.props;

    if (typeof onChangeSortBy === 'function') {
      onChangeSortBy({
        column,
        sort: data ? { ascending: data.value, attribute: column.attribute } : null
      });
    }
  };

  getSelected = (column, sortBy) => {
    if (!sortBy) {
      return null;
    }

    const sort = sortBy.filter(s => s.attribute === column.attribute)[0];

    return sort ? this.sortTypes.filter(o => o.value === sort.ascending)[0] || null : null;
  };

  render() {
    const { column, titleField, sortBy } = this.props;

    return (
      <Columns
        classNamesColumn={'columns_height_full columns-setup__column_align'}
        cols={[
          <div className={'two-columns__left columns-setup__column_align '}>
            <i className="icon-custom-drag-big columns-setup__icon-drag" />
            <Checkbox
              className="columns-setup__next fitnesse-column-setup__checkbox"
              checked={column.default}
              onChange={this.handleChangeVisible}
            />
            <Label className={'label_clear label_middle-grey columns-setup__next'}>{column[titleField] || column.id}</Label>
          </div>,
          sortBy ? (
            <Select
              isClearable
              options={this.sortTypes}
              getOptionLabel={option => option.title}
              getOptionValue={option => option.value}
              onChange={this.handleChangeSortBy}
              className="select_narrow select_width_full ecosZIndexAnchor"
              placeholder={t('journals.default')}
              value={this.getSelected(column, sortBy)}
              styles={{ menuPortal: base => ({ ...base, zIndex: ZIndex.calcZ() }) }}
              menuPortalTarget={document.body}
              menuPlacement="auto"
              closeMenuOnScroll={(e, { innerSelect }) => handleCloseMenuOnScroll(e, innerSelect)}
            />
          ) : null
        ]}
      />
    );
  }
}
