import React, { Component } from 'react';
import classNames from 'classnames';
import Columns from '../common/templates/Columns/Columns';
import { Label } from '../common/form';
import { Dnd2List, List } from '../common/List';
import { Scrollbars } from 'react-custom-scrollbars';
import { t, trigger } from '../../helpers/util';

import './Grouping.scss';
import Checkbox from '../common/form/Checkbox/Checkbox';
import Select from '../common/form/Select/Select';

class ListItem extends Component {
  render() {
    const { item, titleField } = this.props;
    return (
      <div className={'two-columns__left columns-setup__column_align '}>
        <i className="icon-drag columns-setup__icon-drag" />
        <Label className={'label_clear label_middle-grey columns-setup__next'}>{item[titleField]}</Label>
      </div>
    );
  }
}

class AggregationListItem extends Component {
  onChangeAggregationType = e => {
    trigger.call(this, 'onChangeAggregation', e);
  };

  render() {
    const { column, titleField } = this.props;
    const aggregationTypes = [
      {
        attribute: `_${column.attribute}`,
        schema: `sum(${column.attribute})`,
        text: 'Сумма'
      }
    ];

    return (
      <Columns
        classNamesColumn={'columns_height_full columns-setup__column_align'}
        cols={[
          <div className={'two-columns__left columns-setup__column_align '}>
            <Checkbox />
            <Label className={'label_clear label_middle-grey columns-setup__next'}>{column[titleField]}</Label>
          </div>,

          <Select
            options={aggregationTypes}
            getOptionLabel={option => option.text}
            getOptionValue={option => option.schema}
            onChange={this.onChangeAggregationType}
            className={'select_narrow select_width_full'}
            placeholder={t('journals.default')}
          />
        ]}
      />
    );
  }
}

export default class Grouping extends Component {
  grouping = {
    columns: [],
    groupBy: []
  };

  aggregations = [];

  onGrouping = state => {
    const { valueField } = this.props;
    const columns = state.second;

    this.grouping.columns = columns;
    this.grouping.groupBy = [columns.map(col => col[valueField]).join('&')];

    trigger.call(this, 'onGrouping', {
      columns: [...this.grouping.columns, ...this.aggregations],
      groupBy: this.grouping.groupBy
    });
  };

  onChangeAggregation = aggregation => {
    this.aggregations = [aggregation];

    trigger.call(this, 'onGrouping', {
      columns: [...this.grouping.columns, ...this.aggregations],
      groupBy: this.grouping.groupBy
    });
  };

  getList = list => {
    const { grouping, valueField } = this.props;
    return list.filter(item => !grouping.filter(groupingItem => groupingItem[valueField] === item[valueField])[0]);
  };

  getListItem = item => {
    const { titleField } = this.props;
    return <ListItem item={item} titleField={titleField} />;
  };

  getAggregationList = () => {
    return this.props.list.map(column => (
      <AggregationListItem column={column} titleField={this.props.titleField} onChangeAggregation={this.onChangeAggregation} />
    ));
  };

  render() {
    const { list, className, grouping } = this.props;

    return (
      <div className={classNames('grouping', className)}>
        <div className={'grouping__toolbar'}>
          <Columns
            cols={[
              <span className={'grouping__desc'}>{t('grouping.what')}</span>,
              <span className={'grouping__desc'}>{t('grouping.how')}</span>
            ]}
          />
        </div>

        <div className={'grouping__content'}>
          <Dnd2List first={this.getList(list)} second={grouping} tpl={this.getListItem} onMove={this.onGrouping} />
        </div>

        <div className={'grouping__toolbar grouping__toolbar_aggregation'}>
          <Columns
            cols={[
              <span className={'grouping__desc'}>{t('aggregation.columns')}</span>,
              <span className={'grouping__desc'}>{t('aggregation.type')}</span>
            ]}
          />
        </div>

        <div className={'grouping__content grouping__content_aggregation'}>
          <Scrollbars style={{ height: '100%' }}>
            <List className={'ecos-list-group_overflow_visible'} list={this.getAggregationList()} />
          </Scrollbars>
        </div>
      </div>
    );
  }
}
