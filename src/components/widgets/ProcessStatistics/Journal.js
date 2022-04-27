import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { filterJournal, getJournal, resetDashlet } from '../../../actions/processStatistics';
import { t } from '../../../helpers/util';
import { DEFAULT_PAGINATION } from '../../Journals/constants';
import { InfoText, Pagination, Tooltip } from '../../common';
import { IcoBtn } from '../../common/btns';
import { Grid } from '../../common/grid';
import { Labels } from './util';
import Section from './Section';

import './style.scss';

const mapStateToProps = (state, context) => {
  const psState = get(state, ['processStatistics', context.stateId], {});

  return {
    data: psState.data,
    totalCount: psState.totalCount,
    isLoading: psState.isLoadingJournal,
    columns: get(psState, 'journalConfig.columns', []),
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  getJournalData: payload => dispatch(getJournal(payload)),
  filterJournal: payload => dispatch(filterJournal(payload)),
  resetDashlet: payload => dispatch(resetDashlet(payload))
});

class Journal extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    runUpdate: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  };

  static defaultProps = {
    className: ''
  };

  constructor(props) {
    super(props);
    this.state = {
      contentHeight: 0,
      filters: [],
      pagination: DEFAULT_PAGINATION
    };
  }

  componentDidMount() {
    this.getJournal();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.getJournal();
    }
  }

  componentWillUnmount() {
    const { resetDashlet, stateId } = this.props;
    resetDashlet({ stateId });
  }

  getJournal = () => {
    const { getJournalData, record, stateId, selectedJournal } = this.props;
    getJournalData({ stateId, record, selectedJournal, pagination: DEFAULT_PAGINATION });
  };

  filterJournal = () => {
    const { filters, pagination } = this.state;
    const predicates = filters.map(({ att, t, val, needValue }) => {
      const item = { att, t };
      needValue && (item.val = val);
      return item;
    });

    const { filterJournal, record, stateId } = this.props;
    filterJournal({ stateId, record, predicates, pagination });
  };

  handleChangeFilter = (data = [], type) => {
    const { filters = [] } = this.state;
    const newFilter = get(data, '0') || {};
    const foundIndex = filters.findIndex(item => item.att === newFilter.att);
    const newFilters = [...filters];

    if (foundIndex === -1) {
      newFilters.push(newFilter);
    } else {
      newFilters[foundIndex] = newFilter;
    }

    this.setState({ filters: newFilters.filter(item => !!item.t), pagination: DEFAULT_PAGINATION }, this.filterJournal);
  };

  handleChangePage = ({ page, maxItems }) => {
    this.setState(
      ({ pagination }) => ({
        pagination: {
          ...pagination,
          page,
          maxItems,
          skipCount: (page - 1) * maxItems
        }
      }),
      this.filterJournal
    );
  };

  handleResetFilter = () => {
    this.setState({ filters: [], pagination: DEFAULT_PAGINATION }, this.filterJournal);
  };

  render() {
    const { isLoading, columns, isMobile, maxHeight, data, showJournalDefault, totalCount, stateId } = this.props;
    const { filters = [], pagination = {} } = this.state;
    const target = prefix => `${prefix}-${stateId}`.replaceAll(/[\W]/gi, '');

    return (
      <div className="ecos-process-statistics-journal">
        <Section title={t(Labels.JOURNAL_TITLE)} isLoading={isLoading} opened={!!showJournalDefault}>
          {!isLoading && isEmpty(columns) && <InfoText text={t(Labels.NO_COLS)} />}
          <Grid
            fixedHeader
            data={data}
            columns={columns}
            scrollable={!isMobile}
            maxHeight={maxHeight}
            autoHeight
            filterable
            filters={filters}
            onFilter={this.handleChangeFilter}
          />
          <div className="ecos-process-statistics-journal__footer">
            <Pagination page={pagination.page} maxItems={pagination.maxItems} total={totalCount} onChange={this.handleChangePage} />
            <div className="ecos-process-statistics__delimiter" />
            {!!filters.length && (
              <Tooltip off={isMobile} target={target('reset-filter')} text={t(Labels.JOURNAL_RESET_FILTER)} uncontrolled>
                <IcoBtn
                  id={target('reset-filter')}
                  icon={'icon-filter-clean'}
                  className="ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue"
                  onClick={this.handleResetFilter}
                />
              </Tooltip>
            )}
          </div>
        </Section>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journal);
