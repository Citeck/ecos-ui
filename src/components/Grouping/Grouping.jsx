import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import uniqueId from 'lodash/uniqueId';
import isFunction from 'lodash/isFunction';

import Columns from '../common/templates/Columns/Columns';
import { ParserPredicate } from '../Filters/predicates';
import ListItem from './ListItem';
import { ControlledCheckbox, Select } from '../common/form';
import { DndAggragationList, Dnd2List } from '../common/List';
import { NUMBERS } from '../../components/Records/predicates/predicates';
import { t } from '../../helpers/util';
import { GROUPING_COUNT_ALL } from '../../constants/journal';

import './Grouping.scss';

class Grouping extends Component {
  constructor(props) {
    super(props);

    this.state = {
      columns: !isEmpty(props.aggregation) ? props.aggregation.filter(i => i.column.startsWith('_custom_')) : []
    };
  }

  onGrouping = state => {
    const { valueField, aggregation, needCount, onGrouping } = this.props;
    const columns = state.second;
    const groupBy = columns.map(col => col[valueField]).join('&');

    isFunction(onGrouping) &&
      onGrouping({
        columns: [...columns, ...aggregation],
        groupBy: groupBy ? [columns.map(col => col[valueField]).join('&')] : [],
        needCount
      });
  };

  onChangeAggregation = ({ aggregation, column = {}, needCount }) => {
    let { groupBy, grouping, onGrouping, aggregation: aggregations, needCount: prevNeedCount } = this.props;

    if (aggregation) {
      const match = aggregations.find(a => a.column === column.attribute);

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

    isFunction(onGrouping) &&
      onGrouping({
        columns,
        groupBy,
        needCount: isBoolean(needCount) ? needCount : prevNeedCount
      });
  };

  onDeleteAggregation = column => {
    let { grouping, onGrouping, needCount: prevNeedCount, groupBy } = this.props;

    this.setState({ columns: this.state.columns.filter(i => i.column !== column) }, () => {
      isFunction(onGrouping) &&
        onGrouping({
          columns: [...grouping, ...this.state.columns],
          groupBy,
          needCount: prevNeedCount
        });
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

  render() {
    const {
      list,
      className,
      grouping,
      showAggregation,
      needCount,
      allowedColumns,
      aggregation,
      defaultPredicates,
      metaRecord
    } = this.props;

    const defaultAggregation = allowedColumns.filter(c => c.default && NUMBERS.includes(c.type));

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
                metaRecord={metaRecord}
                noScroll
                titleField="label"
                classNameItem="columns-setup__item fitnesse-columns-setup__item"
                draggableClassName={'ecos-dnd-list__item_draggable'}
                data={[...defaultAggregation, ...this.state.columns]}
                aggregations={aggregation}
                columns={allowedColumns}
                defaultPredicates={defaultPredicates}
                onChangeAggregation={this.onChangeAggregation}
                onDeleteAggregation={this.onDeleteAggregation}
              />
              <Select
                className="ecos-filters-group__select select_narrow ecos-select_blue"
                placeholder="Add column"
                options={[{ label: 'New column', value: 'new' }]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
                onChange={() => {
                  const attribute = uniqueId('_custom_');

                  const aggregation = {
                    id: attribute,
                    visible: true,
                    label: 'New column',
                    column: attribute,
                    attribute: attribute,
                    text: 'New column',
                    sortable: false,
                    hasCustomField: true,
                    newEditor: { type: 'text', config: {} },
                    type: 'TEXT'
                  };

                  this.setState({ columns: [...this.state.columns, aggregation] }, () => {
                    this.onChangeAggregation({ aggregation, column: attribute });
                  });
                }}
              />
            </div>
          </>
        ) : null}
      </div>
    );
  }
}

function mapStateToProps(_state, props) {
  const { allowedColumns = [] } = props;

  const predicates = ParserPredicate.getDefaultPredicates(allowedColumns);

  return { defaultPredicates: cloneDeep(predicates) };
}

export default connect(mapStateToProps)(Grouping);
