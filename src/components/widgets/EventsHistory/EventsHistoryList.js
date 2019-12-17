import * as React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
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
    const { list, columns } = this.props;
    //todo for server filer const { filters } = this.state;

    return (
      <Grid data={list} columns={columns} scrollable={false} className="ecos-event-history-list_view-table" />
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
