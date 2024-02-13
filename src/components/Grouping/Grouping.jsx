import React, { Component } from 'react';
import classNames from 'classnames';
import isBoolean from 'lodash/isBoolean';

import Columns from '../common/templates/Columns/Columns';
import ListItem from './ListItem';
import { ControlledCheckbox, Select } from '../common/form';
import { DndAggragationList, Dnd2List } from '../common/List';
import { NUMBERS } from '../../components/Records/predicates/predicates';
import { t, trigger } from '../../helpers/util';
import { GROUPING_COUNT_ALL } from '../../constants/journal';
import AggregationListItem from '../ColumnsSetup/AggregationListItem';

import './Grouping.scss';

export default class Grouping extends Component {
  onGrouping = state => {
    const { valueField, aggregation, needCount } = this.props;
    const columns = state.second;
    const groupBy = columns.map(col => col[valueField]).join('&');

    trigger.call(this, 'onGrouping', {
      columns: [...columns, ...aggregation],
      groupBy: groupBy ? [columns.map(col => col[valueField]).join('&')] : [],
      needCount
    });
  };

  onChangeAggregation = ({ aggregation, column = {}, needCount }) => {
    let { groupBy, grouping, aggregation: aggregations, needCount: prevNeedCount } = this.props;

    if (aggregation) {
      const match = aggregations.filter(a => a.column === column.attribute)[0];

      if (!match) {
        aggregations.push(aggregation);
      } else {
        aggregations = aggregations.map(a => (a.column === column.attribute ? aggregation : a));
      }
    } else {
      aggregations = aggregations.filter(a => a.column !== column.attribute);
    }

    const columns = [...grouping, ...aggregations].sort((a, b) => {
      if (a.column === GROUPING_COUNT_ALL) {
        return 1;
      } else if (b.column === GROUPING_COUNT_ALL) {
        return -1;
      }

      return 0;
    });

    trigger.call(this, 'onGrouping', {
      columns,
      groupBy,
      needCount: isBoolean(needCount) ? needCount : prevNeedCount
    });
  };

  onChangeAllCount = () => {
    const { needCount } = this.props;
    const targetValue = !needCount;

    const data = {
      attribute: `_${GROUPING_COUNT_ALL}`,
      schema: 'count(*)',
      label: { ru: 'Общее Количество', en: 'Total count' },
      sortable: true,
      column: GROUPING_COUNT_ALL
    };

    this.onChangeAggregation({
      aggregation: targetValue ? data : null,
      column: { attribute: GROUPING_COUNT_ALL },
      needCount: targetValue
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
    let { allowedColumns, titleField, aggregation } = this.props;

    const aggregationColumns = allowedColumns.filter(c => c.default && NUMBERS.includes(c.type));

    return aggregationColumns.map(column => {
      const selected = aggregation.filter(a => a.attribute.substr(1) === column.attribute)[0] || null;

      return (
        <AggregationListItem
          column={column}
          titleField={titleField}
          aggregation={aggregation}
          selected={selected}
          checked={!!selected}
          onChangeAggregation={this.onChangeAggregation}
        />
      );
    });
  };

  render() {
    const { list, className, grouping, showAggregation, needCount, allowedColumns, aggregation } = this.props;
    console.log(allowedColumns, aggregation);

    return (
      <div className={classNames('grouping', className)}>
        <div className={'grouping__toolbar'}>
          {!!showAggregation && (
            <ControlledCheckbox checked={needCount} onClick={this.onChangeAllCount}>
              {t('grouping.show_count')}
            </ControlledCheckbox>
          )}
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
          <>
            <div className={'grouping__toolbar grouping__toolbar_aggregation'}>
              <Columns
                cols={[
                  <span className={'grouping__desc'}>{t('aggregation.columns')}</span>,
                  <span className={'grouping__desc'}>{t('aggregation.type')}</span>
                ]}
              />
            </div>

            <div className={'grouping__content grouping__content_aggregation'}>
              <DndAggragationList
                noScroll
                titleField="label"
                classNameItem="columns-setup__item fitnesse-columns-setup__item"
                draggableClassName={'ecos-dnd-list__item_draggable'}
                data={allowedColumns.filter(c => c.default && NUMBERS.includes(c.type))}
                aggregation={aggregation}
                columns={allowedColumns}
              />
              <Select
                className="ecos-filters-group__select select_narrow ecos-select_blue"
                placeholder="Add column"
                options={allowedColumns.filter(c => c.default && NUMBERS.includes(c.type))}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
                onChange={console.log}
              />
            </div>
          </>
        ) : null}
      </div>
    );
  }
}
