import * as React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
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
    const { list, columns, onFilter } = this.props;
    const { filters } = this.state;

    const filter = filters => {
      this.setState({ filters }, () => {
        onFilter(filters);
      });
    };

    return (
      <Grid
        data={list}
        columns={columns}
        scrollable={false}
        className={`${this.className}_view-table`}
        filterable
        filters={filters}
        onFilter={filter}
      />
    );
  }

  render() {
    const { isSmallMode, isLoading, list, columns, isMobile } = this.props;

    if (isLoading) {
      return <Loader className={`${this.className}__loader`} />;
    }

    if (isEmpty(list) || isEmpty(columns)) {
      return <InfoText text={t('Событий не было')} />;
    }
    if (isSmallMode || isMobile) {
      return this.renderEnum();
    }

    return this.renderTable();
  }
}

export default EventsHistoryList;
