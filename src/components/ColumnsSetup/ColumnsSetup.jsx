import React, { Component } from 'react';
import classNames from 'classnames';
import Checkbox from '../common/form/Checkbox/Checkbox';
import Select from '../common/form/Select/Select';
import Label from '../common/form/Label/Label';
import Columns from '../common/templates/Columns/Columns';
import { DndList } from '../common/List';
import { t, trigger } from '../../helpers/util';

import './ColumnsSetup.scss';

class ListItem extends Component {
  changeVisible = e => {
    this.props.column.default = e.checked;
    trigger.call(this, 'onChangeVisible', e);
  };

  changeSortBy = e => {
    trigger.call(this, 'onChangeSortBy', {
      ascending: e.value,
      attribute: this.props.column.attribute
    });
  };

  render() {
    const { column, titleField } = this.props;

    return (
      <Columns
        classNamesColumn={'columns_height_full columns-setup__column_align'}
        cols={[
          <div className={'two-columns__left columns-setup__column_align '}>
            <i className="icon-drag columns-setup__icon-drag" />
            <Checkbox className={'columns-setup__next'} checked={column.default} onChange={this.changeVisible} />
            <Label className={'label_clear label_middle-grey columns-setup__next'}>{column[titleField]}</Label>
          </div>,

          <Select
            options={[{ title: 'По возрастанию', value: true }, { title: 'По убыванию', value: false }]}
            getOptionLabel={option => option.title}
            getOptionValue={option => option.value}
            onChange={this.changeSortBy}
            className={'select_narrow select_width_full'}
            placeholder={t('journals.default')}
          />
        ]}
      />
    );
  }
}

export default class ColumnsSetup extends Component {
  getListItem = column => {
    return (
      <ListItem
        column={column}
        titleField={this.props.titleField}
        onChangeVisible={this.onChangeVisible}
        onChangeSortBy={this.onChangeSortBy}
      />
    );
  };

  onOrder = orderedColumns => {
    trigger.call(this, 'onOrder', orderedColumns);
  };

  onChangeVisible = () => {
    trigger.call(this, 'onChangeVisible', this.props.columns);
  };

  onChangeSortBy = sortBy => {
    trigger.call(this, 'onChangeSortBy', sortBy);
  };

  render() {
    const { columns, className, classNameToolbar } = this.props;
    const cssClasses = classNames('columns-setup', className);
    const cssToolbarClasses = classNames('columns-setup__toolbar', classNameToolbar);

    return (
      <div className={cssClasses}>
        <div className={cssToolbarClasses}>
          <Columns
            cols={[
              <span className={'columns-setup__desc'}>{t('columns-setup.order')}</span>,
              <span className={'columns-setup__desc'}>{t('columns-setup.sort')}</span>
            ]}
          />
        </div>

        <div className={'columns-setup__content'}>
          <DndList classNameItem={'columns-setup__item'} data={columns} tpl={this.getListItem} onOrder={this.onOrder} />
        </div>
      </div>
    );
  }
}
