import * as React from 'react';
import PropTypes from 'prop-types';
import { get, isEmpty } from 'lodash';
import { t } from '../../helpers/util';
import { Grid } from '../common/grid';
import { InfoText, Loader } from '../common';
import EventsHistoryCard from './EventsHistoryCard';

class EventsHistoryList extends React.Component {
  static propTypes = {
    list: PropTypes.array,
    columns: PropTypes.array,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool
  };

  static defaultProps = {
    list: [],
    columns: [],
    className: '',
    isSmallMode: false,
    isMobile: false,
    isLoading: false
  };

  className = 'ecos-action-history-list';

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
      <div className={`${this.className}_view-enum`}>
        {list.map((item, i) => (
          <EventsHistoryCard key={item.id + i} columns={columns} event={item} />
        ))}
      </div>
    );
  }

  renderTable() {
    const { list, columns } = this.props;
    const { filters } = this.state;

    return (
      <Grid data={list} columns={columns} scrollable={false} className={`${this.className}_view-table`} />
      // filterable={false}
      // filters={filters}
      // onFilter={this.onGridFilter}
    );
  }

  render() {
    const { isSmallMode, isMobile, isLoading, list, columns } = this.props;

    if (isLoading) {
      return <Loader className={`${this.className}__loader`} />;
    }

    if (isEmpty(columns)) {
      return <InfoText text={t('Нет настроек отображения')} />;
    }

    if (isEmpty(list)) {
      return <InfoText text={t('Нет событий')} />;
    }

    if (isSmallMode || isMobile) {
      return this.renderEnum();
    }

    return this.renderTable();
  }
}

export default EventsHistoryList;
