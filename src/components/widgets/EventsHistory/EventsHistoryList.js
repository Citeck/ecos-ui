import * as React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { Grid } from '../../common/grid/index';
import { InfoText, Loader } from '../../common/index';
import EventsHistoryCard from './EventsHistoryCard';

class EventsHistoryList extends React.Component {
  static propTypes = {
    list: PropTypes.array,
    columns: PropTypes.array,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
  };

  static defaultProps = {
    list: [],
    columns: [],
    className: '',
    isSmallMode: false,
    isMobile: false,
    isLoading: false
  };

  state = {
    filters: []
  };

  formattedColumnData = () => {
    const { columns, forwardedRef } = this.props;
    const wrapper = get(forwardedRef, 'current', null);

    if (!wrapper) {
      return [];
    }

    const table = wrapper.querySelector('table');

    if (!table) {
      return columns;
    }

    const headCells = table.querySelectorAll('thead th');
    const bodyCells = table.querySelectorAll('tbody tr:first-child td');

    return columns.map((column, index) => this.getColumnData(column, headCells[index], bodyCells[index]));
  };

  getColumnData = (column, hCell = null, bCell = null) => {
    if (!bCell || !hCell) {
      return column;
    }

    const thw = hCell.offsetWidth;
    const tdw = bCell.offsetWidth;
    const width = `${Math.max(thw, tdw)}px`;

    return {
      ...column
      // width,
      // style: () => ({ width }),
      // headerStyle: () => ({ width })
    };
  };

  onGridFilter = (newFilters = []) => {
    const { onFilter } = this.props;
    const { filters } = this.state;
    const newFilter = get(newFilters, '0', {});
    const upFilters = filters.filter(item => item.att !== newFilter.att).concat(newFilters || []);

    this.setState({ filters: upFilters }, () => {
      onFilter(this.state.filters);
    });
  };

  renderEnum() {
    const { list, columns } = this.props;

    return (
      <div className="ecos-event-history-list_view-enum">
        {list.map((item, i) => (
          <EventsHistoryCard key={item.id + i} columns={columns} event={item} />
        ))}
      </div>
    );
  }

  renderTable() {
    const { list } = this.props;
    //todo for server filer const { filters } = this.state;

    return (
      <Grid
        data={list}
        columns={this.formattedColumnData()}
        scrollable={false}
        className="ecos-event-history-list_view-table ecos-grid_no-top-border"
        fixedHeader
      />
      // filterable={false}
      // filters={filters}
      // onFilter={this.onGridFilter}
    );
  }

  renderContent() {
    const { isSmallMode, isMobile, isLoading, list, columns } = this.props;

    if (isLoading) {
      return <Loader className="ecos-event-history-list__loader" />;
    }

    if (isEmpty(columns)) {
      return <InfoText text={t('events-history-widget.info.no-columns')} />;
    }

    if (isEmpty(list)) {
      return <InfoText text={t('events-history-widget.info.no-events')} />;
    }

    if (isSmallMode || isMobile) {
      return this.renderEnum();
    }

    return this.renderTable();
  }

  render() {
    const { forwardedRef } = this.props;

    return <div ref={forwardedRef}>{this.renderContent()}</div>;
  }
}

export default EventsHistoryList;
