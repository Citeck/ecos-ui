import React, { Component } from 'react';
import classNames from 'classnames';

import Columns from '../common/templates/Columns/Columns';
import { DndList } from '../common/List';
import { t } from '../../helpers/util';

import './ColumnsSetup.scss';

export default class ColumnsSetup extends Component {
  onChangeOrder = columns => {
    this.onChange([...columns, ...this.invisible], this.props.sortBy);
  };

  onChangeVisible = ({ column, checked }) => {
    const columns = this.setColumnVisible(column, checked);
    const sortBy = checked ? this.props.sortBy : this.setSortBy(column, null);

    this.onChange(columns, sortBy);
  };

  onChangeSortBy = ({ sort, column }) => {
    const sortBy = this.setSortBy(column, sort);
    const columns = sort ? this.setColumnVisible(column, true) : this.props.columns;

    this.onChange(columns, sortBy);
  };

  onChange = (columns, sortBy) => {
    const { onChange } = this.props;

    if (typeof onChange === 'function') {
      onChange({ columns, sortBy });
    }
  };

  setSortBy = (column, sort) => {
    let sortBy = this.props.sortBy;

    if (sort) {
      const match = sortBy.filter(s => s.attribute === sort.attribute)[0];

      if (match) {
        sortBy = sortBy.map(s => (s.attribute === sort.attribute ? sort : s));
      } else {
        sortBy.push(sort);
      }
    } else {
      sortBy = sortBy.filter(s => s.attribute !== column.attribute);
    }

    return sortBy;
  };

  setColumnVisible = (column, checked) => {
    return this.props.columns.map(c => {
      if (c.attribute === column.attribute) {
        c.default = checked;
      }

      return c;
    });
  };

  splitByVisible(columns) {
    const visible = [];
    const invisible = [];

    columns.forEach(c => (c.visible ? visible.push(c) : invisible.push(c)));

    return { visible, invisible };
  }

  render() {
    const { columns, className, classNameToolbar, sortBy, titleField } = this.props;
    const cssClasses = classNames('columns-setup', className);
    const cssToolbarClasses = classNames('columns-setup__toolbar', classNameToolbar);
    const { visible, invisible } = this.splitByVisible(columns);

    this.invisible = invisible;

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
          <DndList
            noScroll
            classNameItem="columns-setup__item fitnesse-columns-setup__item"
            draggableClassName={'ecos-dnd-list__item_draggable'}
            sortBy={sortBy}
            data={visible}
            titleField={titleField}
            onOrder={this.onChangeOrder}
            onChangeVisible={this.onChangeVisible}
            onChangeSortBy={this.onChangeSortBy}
          />
        </div>
      </div>
    );
  }
}
