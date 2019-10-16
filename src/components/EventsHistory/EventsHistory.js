import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { DefineHeight } from '../common';
import { selectDataEventsHistoryByStateId } from '../../selectors/eventsHistory';
import { filterEventsHistory, getEventsHistory, resetEventsHistory } from '../../actions/eventsHistory';
import EventsHistoryList from './EventsHistoryList';
import EventsHistoryService from '../../services/eventsHistory';

import './style.scss';

const mapStateToProps = (state, context) => {
  const ahState = selectDataEventsHistoryByStateId(state, context.stateId) || {};

  return {
    list: ahState.list,
    isLoading: ahState.isLoading,
    columns: isEmpty(ahState.columns)
      ? isEmpty(context.myColumns)
        ? EventsHistoryService.config.columns
        : context.myColumns
      : ahState.columns,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  getEventsHistory: payload => dispatch(getEventsHistory(payload)),
  filterEventsHistory: payload => dispatch(filterEventsHistory(payload)),
  resetEventsHistory: payload => dispatch(resetEventsHistory(payload))
});

class EventsHistory extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    myColumns: PropTypes.array
  };

  static defaultProps = {
    className: '',
    isSmallMode: false,
    isMobile: false,
    isLoading: false,
    myColumns: []
  };

  state = {
    contentHeight: 0
  };

  _filter = React.createRef();

  componentDidMount() {
    this.getEventsHistory();
  }

  componentWillUnmount() {
    const { resetEventsHistory, stateId } = this.props;

    resetEventsHistory({ stateId });
  }

  getEventsHistory = () => {
    const { getEventsHistory, record, stateId, columns } = this.props;

    getEventsHistory({
      stateId,
      record,
      columns
    });
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  onFilter = predicates => {
    const { filterEventsHistory, record, stateId, columns } = this.props;

    filterEventsHistory({
      stateId,
      record,
      columns,
      predicates
    });
  };

  render() {
    const { isLoading, isMobile, isSmallMode, className, height, minHeight, maxHeight, list, columns } = this.props;
    const { contentHeight } = this.state;

    const filterHeight = get(this._filter, 'current.offsetHeight', 0);
    const fixHeight = height ? height - filterHeight : null;

    return (
      <div className={classNames('ecos-event-history', className)}>
        <div ref={this._filter}>
          {/*{(isMobile || isSmallMode) && (
            <DropdownFilter columns={columns} className={`${this.className}__filter`} onFilter={this.onFilter} />
          )}*/}
        </div>
        <Scrollbars
          className="ecos-event-history__scroll"
          style={{ height: contentHeight || '100%' }}
          renderTrackVertical={props => <div {...props} className="ecos-event-history__v-scroll" />}
        >
          <DefineHeight
            fixHeight={fixHeight}
            maxHeight={maxHeight - filterHeight}
            minHeight={minHeight}
            isMin={isLoading || isEmpty(list)}
            getOptimalHeight={this.setHeight}
          >
            <EventsHistoryList
              list={list}
              columns={columns}
              isLoading={isLoading}
              isSmallMode={isSmallMode}
              isMobile={isMobile}
              className="ecos-event-history__content"
              onFilter={this.onFilter}
            />
          </DefineHeight>
        </Scrollbars>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EventsHistory);
