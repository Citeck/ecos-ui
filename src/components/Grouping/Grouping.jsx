import React, { Component, Fragment } from 'react';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';

import Columns from '../common/templates/Columns/Columns';
import Checkbox from '../common/form/Checkbox/Checkbox';
import Select from '../common/form/Select/Select';
import { Label } from '../common/form';
import { Dnd2List, List } from '../common/List';
import { NUMBERS } from '../../components/Records/predicates/predicates';
import { t, trigger } from '../../helpers/util';

import './Grouping.scss';

class ListItem extends Component {
  render() {
    const { item, titleField } = this.props;
    return (
      <div className={'two-columns__left columns-setup__column_align '}>
        <i className="icon-custom-drag-big columns-setup__icon-drag" />
        <Label className={'label_clear label_middle-grey columns-setup__next'}>{item[titleField]}</Label>
      </div>
    );
  }
}

class AggregationListItem extends Component {
  constructor(props) {
    super(props);
    this.aggregationTypes = [
      {
        attribute: `_${props.column.attribute}`,
        schema: `sum(${props.column.attribute})`,
        text: 'Сумма',
        column: props.column.attribute
      }
    ];
  }

  onChangeAggregationType = e => {
    trigger.call(this, 'onChangeAggregation', { aggregation: e, column: this.props.column });
  };

  onCheckColumn = e => {
    trigger.call(this, 'onChangeAggregation', { aggregation: e.checked ? this.aggregationTypes[0] : null, column: this.props.column });
  };

  render() {
    const { column, titleField, selected } = this.props;

    return (
      <Columns
        classNamesColumn={'columns_height_full columns-setup__column_align'}
        cols={[
          <div className={'two-columns__left columns-setup__column_align '}>
            <Checkbox checked={Boolean(selected)} onChange={this.onCheckColumn} />
            <Label className={'label_clear label_middle-grey columns-setup__next'}>{column[titleField]}</Label>
          </div>,

          <Select
            isClearable={true}
            options={this.aggregationTypes}
            getOptionLabel={option => option.text}
            getOptionValue={option => option.schema}
            onChange={this.onChangeAggregationType}
            className={'select_narrow select_width_full'}
            placeholder={t('journals.default')}
            value={selected}
          />
        ]}
      />
    );
  }
}

export default class Grouping extends Component {
  onGrouping = state => {
    const { valueField, aggregation } = this.props;
    const columns = state.second.map(c => ({
      ...c,
      formatter: c.type === 'assoc' || c.type === 'options' ? 'StrAndDispFormatter' : c.formatter
    }));
    const groupBy = columns.map(col => col[valueField]).join('&');

    trigger.call(this, 'onGrouping', {
      columns: [...columns, ...aggregation],
      groupBy: groupBy ? [columns.map(col => col[valueField]).join('&')] : []
    });
  };

  onChangeAggregation = ({ aggregation, column }) => {
    let { groupBy, grouping, aggregation: aggregations } = this.props;

    if (aggregation) {
      const match = aggregations.filter(a => a.column === column.attribute)[0];

      if (match) {
        aggregations = aggregations.map(a => (a.attribute === column.attribute ? aggregation : a));
      } else {
        aggregations.push(aggregation);
      }
    } else {
      aggregations = aggregations.filter(a => a.column !== column.attribute);
    }

    trigger.call(this, 'onGrouping', {
      columns: [...grouping, ...aggregations],
      groupBy
    });
  };

  getFirst = columns => {
    const { grouping, valueField } = this.props;
    return columns.filter(column => !grouping.filter(g => g[valueField] === column[valueField])[0]);
  };

  getGroupingList = item => {
    const { titleField } = this.props;
    return <ListItem item={item} titleField={titleField} />;
  };

  getAggregationList = () => {
    let { list, titleField, aggregation } = this.props;

    list = list.filter(l => NUMBERS.filter(n => n === l.type)[0]);

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
    const { list, className, grouping, showAggregation } = this.props;

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
          <Dnd2List
            first={this.getFirst(list)}
            second={grouping}
            tpl={this.getGroupingList}
            onMove={this.onGrouping}
            draggableClassName={'ecos-dnd-list__item_draggable'}
          />
        </div>

        {showAggregation ? (
          <Fragment>
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
          </Fragment>
        ) : null}
      </div>
    );
  }
}
