import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { filterJournal, getJournal, changeFilter, changePagination, setFilters, setPagination } from '../../../actions/processStatistics';
import { t } from '../../../helpers/util';
import { DEFAULT_PAGINATION } from '../../../components/Journals/constants';
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
    filters: psState.filters,
    pagination: psState.pagination,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  getJournalData: payload => dispatch(getJournal(payload)),
  filterJournal: payload => dispatch(filterJournal(payload)),
  changeFilter: payload => dispatch(changeFilter(payload)),
  changePagination: payload => dispatch(changePagination(payload)),
  setFilters: payload => dispatch(setFilters(payload)),
  setPagination: payload => dispatch(setPagination(payload)),
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

  getJournal = () => {
    const { getJournalData, record, stateId, selectedJournal } = this.props;
    getJournalData({ stateId, record, selectedJournal, pagination: DEFAULT_PAGINATION });
  };

  filterJournal = () => {
    const { filterJournal, record, stateId } = this.props;

    filterJournal({ stateId, record });
  };

  handleChangeFilter = (data = [], type) => {
    const { changeFilter, stateId, record } = this.props;

    changeFilter({ stateId, data, record });
  };

  handleChangePage = ({ page, maxItems }) => {
    const { changePagination, stateId } = this.props;

    changePagination({ stateId, page, maxItems });
  };

  handleResetFilter = () => {
    const { setFilters, setPagination, stateId } = this.props;

    setFilters({ stateId, filters: []});
    setPagination({ stateId, pagination: DEFAULT_PAGINATION });
    this.filterJournal();
  };

  render() {
    const { isLoading, columns, isMobile, maxHeight, data, showJournalDefault, totalCount, stateId, filters, pagination } = this.props;

    const target = prefix => `${prefix}-${stateId}`.replaceAll(/[\W]/gi, '');

    return (
      <div className="ecos-process-statistics-journal">
        <Section title={t(Labels.JOURNAL_TITLE)} isLoading={isLoading} opened={!!showJournalDefault}>
          {!isLoading && isEmpty(columns) && <InfoText text={t(Labels.NO_COLS)} />}
          <div className="ecos-process-statistics-journal__panel">
            <Pagination page={pagination.page} maxItems={pagination.maxItems} total={totalCount} onChange={this.handleChangePage} />
            <div className="ecos-process-statistics__delimiter" />
            {!!filters.length && (
              <Tooltip off={isMobile} target={target('reset-filter')} text={t(Labels.JOURNAL_RESET_FILTER)} uncontrolled>
                <IcoBtn
                  id={target('reset-filter')}
                  icon={'icon-filter-clean'}
                  className="ecos-btn_sq_sm ecos-btn_tight"
                  onClick={this.handleResetFilter}
                />
              </Tooltip>
            )}
          </div>
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
            className="ecos-process-statistics-journal__grid"
          />
        </Section>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journal);
