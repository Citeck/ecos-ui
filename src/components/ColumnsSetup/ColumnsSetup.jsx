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
  constructor(props) {
    super(props);
    const { column, sortBy } = props;
    this.state = { selected: this.getSelected(column, sortBy) };
  }

  options = [{ title: 'По возрастанию', value: true }, { title: 'По убыванию', value: false }];

  changeVisible = e => {
    this.props.column.default = e.checked;
    trigger.call(this, 'onChangeVisible', e);
  };

  changeSortBy = e => {
    this.props.sortBy[0] = {
      ascending: e.value,
      attribute: this.props.column.attribute
    };

    this.setState({ selected: e });

    trigger.call(this, 'onChangeSortBy', e);
  };

  getSelected = (column, sortBy) => {
    const sort = sortBy.filter(s => s.attribute === column.attribute)[0];
    return sort ? this.options.filter(o => o.value === sort.ascending)[0] : null;
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
            options={this.options}
            getOptionLabel={option => option.title}
            getOptionValue={option => option.value}
            onChange={this.changeSortBy}
            className={'select_narrow select_width_full'}
            placeholder={t('journals.default')}
            value={this.state.selected}
          />
        ]}
      />
    );
  }
}

export default class ColumnsSetup extends Component {
  getListItem = (column, props) => {
    return (
      <ListItem
        column={column}
        sortBy={props.sortBy}
        titleField={this.props.titleField}
        onChangeVisible={this.onChangeVisible}
        onChangeSortBy={this.onChangeSortBy}
      />
    );
  };

  onOrder = orderedColumns => {
    for (let i = 0, length = this.props.columns.length; i < length; i++) {
      this.props.columns[i] = orderedColumns[i];
    }
    const { columns, sortBy } = this.props;
    this.onChange(columns, sortBy);
  };

  onChangeVisible = () => {
    const { columns, sortBy } = this.props;
    this.onChange(columns, sortBy);
  };

  onChangeSortBy = () => {
    const { columns, sortBy } = this.props;
    this.onChange(columns, sortBy);
  };

  onChange = (columns, sortBy) => {
    trigger.call(this, 'onChange', { columns, sortBy });
  };

  render() {
    const { columns, className, classNameToolbar, sortBy } = this.props;
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
          <DndList classNameItem={'columns-setup__item'} sortBy={sortBy} data={columns} tpl={this.getListItem} onOrder={this.onOrder} />
        </div>
      </div>
    );
  }
}
