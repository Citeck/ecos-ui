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
  constructor(props) {
    super(props);

    this.state = { types: [], selected: props.selected };

    this.aggregationTypes = [
      {
        attribute: `_${props.column.attribute}`,
        schema: `sum(${props.column.attribute})`,
        text: 'Сумма'
      }
    ];
  }

  componentDidUpdate(prevProps) {
    const props = this.props;
    if (props.selected !== prevProps.selected) {
      this.setState({ selected: props.selected });
    }
  }

  onChangeAggregationType = e => {
    this.setState({ selected: e });
    trigger.call(this, 'onChangeAggregation', e);
  };

  onCheckColumn = e => {
    if (e.checked) {
      this.setState({ types: this.aggregationTypes });
    } else {
      this.setState({ types: [] });
      this.setState({ selected: null });
      trigger.call(this, 'onChangeAggregation', null);
    }
  };

  render() {
    const { column, titleField } = this.props;

    return (
      <Columns
        classNamesColumn={'columns_height_full columns-setup__column_align'}
        cols={[
          <div className={'two-columns__left columns-setup__column_align '}>
            <Checkbox checked={Boolean(this.state.selected)} onChange={this.onCheckColumn} />
            <Label className={'label_clear label_middle-grey columns-setup__next'}>{column[titleField]}</Label>
          </div>,

          <Select
            options={this.state.types}
            getOptionLabel={option => option.text}
            getOptionValue={option => option.schema}
            onChange={this.onChangeAggregationType}
            className={'select_narrow select_width_full'}
            placeholder={t('journals.default')}
            value={this.state.selected}
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
    const groupBy = columns.map(col => col[valueField]).join('&');

    this.grouping.columns = columns;
    this.grouping.groupBy = groupBy ? [columns.map(col => col[valueField]).join('&')] : [];

    trigger.call(this, 'onGrouping', {
      columns: [...this.grouping.columns, ...this.aggregations],
      groupBy: this.grouping.groupBy
    });
  };

  onChangeAggregation = aggregation => {
    this.aggregations = aggregation ? [aggregation] : [];

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
    const { list, titleField, aggregation } = this.props;

    return list.map(column => {
      const selected =
        aggregation.filter(a => {
          return a.attribute.substr(1) === column.attribute;
        })[0] || null;

      return (
        <AggregationListItem
          column={column}
          titleField={titleField}
          aggregation={aggregation}
          selected={selected}
          onChangeAggregation={this.onChangeAggregation}
        />
      );
    });
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
