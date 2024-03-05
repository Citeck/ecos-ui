import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import isBoolean from 'lodash/isBoolean';
import cloneDeep from 'lodash/cloneDeep';
import isFunction from 'lodash/isFunction';
import isEqual from 'lodash/isEqual';

import Columns from '../common/templates/Columns/Columns';
import { ParserPredicate } from '../Filters/predicates';
import ListItem from './ListItem';
import { ControlledCheckbox, Select } from '../common/form';
import { DndAggragationList, Dnd2List } from '../common/List';
import { NUMBERS } from '../../components/Records/predicates/predicates';
import { getId, t } from '../../helpers/util';
import { GROUPING_COUNT_ALL } from '../../constants/journal';

import './Grouping.scss';

class Grouping extends Component {
  constructor(props) {
    super(props);

    const columns = props.aggregation.filter(i => i.column.startsWith('_custom_'));

    this.state = { columns, needCount: props.needCount };
  }

  componentDidUpdate(prevProps) {
    const { aggregation, needCount } = this.props;

    if (!isEqual(aggregation, prevProps.aggregation)) {
      this.setState({ columns: aggregation.filter(i => i.column && i.column.startsWith('_custom_')) });
    }

    if (!isEqual(needCount, prevProps.needCount)) {
      this.setState({ needCount: needCount });
    }
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

    const columns = [...grouping, ...aggregations].sort(this._sortOrderAggregation);

    this.setState({ columns: columns.filter(({ column }) => column && column.startsWith('_custom_')) }, () => {
      isFunction(onGrouping) && onGrouping({ columns, groupBy, needCount: isBoolean(needCount) ? needCount : prevNeedCount });
    });
  };

  _sortOrderAggregation = (a, b) => {
    if (a.column === GROUPING_COUNT_ALL) {
      return 2;
    } else if (b.column === GROUPING_COUNT_ALL) {
      return -2;
    }

    if (a.column && a.column.startsWith('_custom_')) {
      return 1;
    } else if (b.column && b.column.startsWith('_custom_')) {
      return -1;
    }

    return 0;
  };

  onChangeOrderAggregation = orderedColumns => {
    let { groupBy, aggregation, grouping, onGrouping, needCount: prevNeedCount } = this.props;

    const stateColumns = orderedColumns.filter(({ column }) => column && column.startsWith('_custom_'));
    const orderedIdx = orderedColumns.map(column => column.id);
    const orderedAggregarions = [...aggregation].sort((a, b) => orderedIdx.indexOf(a.id) - orderedIdx.indexOf(b.id));
    const columns = [...grouping, ...orderedAggregarions].sort(this._sortOrderAggregation);

    this.setState({ columns: stateColumns }, () => {
      isFunction(onGrouping) && onGrouping({ columns, groupBy, needCount: prevNeedCount });
    });
  };

  onDeleteAggregation = column => {
    const { grouping, onGrouping, needCount: prevNeedCount, aggregation: aggregations, groupBy } = this.props;

    this.setState({ columns: this.state.columns.filter(i => i.column !== column) }, () => {
      isFunction(onGrouping) &&
        onGrouping({
          columns: [...grouping, ...aggregations.filter(i => i.column !== column)],
          groupBy,
          needCount: prevNeedCount
        });
    });
  };

  onChangeAllCount = () => {
    const { needCount } = this.state;
    const targetValue = !needCount;

    const data = {
      attribute: `_${GROUPING_COUNT_ALL}`,
      schema: 'count(*)',
      label: { ru: 'Общее Количество', en: 'Total count' },
      sortable: true,
      column: GROUPING_COUNT_ALL
    };

    this.setState({ needCount: targetValue }, () => {
      this.onChangeAggregation({
        aggregation: targetValue ? data : null,
        column: { attribute: GROUPING_COUNT_ALL },
        needCount: targetValue
      });
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
      allowedColumns,
      aggregation: aggregations,
      defaultPredicates,
      metaRecord
    } = this.props;

    const { needCount } = this.state;
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
                aggregations={aggregations}
                data={[...defaultAggregation, ...this.state.columns]}
                columns={allowedColumns}
                defaultPredicates={defaultPredicates}
                onChangeAggregation={this.onChangeAggregation}
                onDeleteAggregation={this.onDeleteAggregation}
                onChangeOrderAggregation={this.onChangeOrderAggregation}
              />
              <Select
                className="ecos-filters-group__select select_narrow ecos-select_blue"
                placeholder={t('grouping.add_column')}
                options={defaultAggregation}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.attribute}
                value={null}
                onChange={value => {
                  const column = getId(`_custom_${value.attribute}_`);

                  const aggregation = {
                    ...value,
                    id: column,
                    column,
                    attribute: column,
                    schema: `_custom_${value.schema}`,
                    attSchema: `${column}?num`,
                    sortable: false,
                    searchable: false,
                    hasCustomField: true,
                    label: {
                      en: 'New column',
                      ru: 'Новая колонка'
                    },
                    originAttribute: value.attribute,
                    originColumn: value,
                    hasTotalSumField: false,
                    visible: true,
                    name: column
                  };

                  this.setState({ columns: [...this.state.columns, aggregation] }, () => {
                    this.onChangeAggregation({ aggregation, column });
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
