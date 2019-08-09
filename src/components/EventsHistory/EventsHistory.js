import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { get, isEmpty } from 'lodash';
import { DefineHeight } from '../common';
import { selectDataEventsHistoryByStateId } from '../../selectors/eventsHistory';
import { filterEventsHistory, getEventsHistory } from '../../actions/eventsHistory';
import EventsHistoryList from './EventsHistoryList';
import EventsHistoryService from '../../services/eventsHistory';

import './style.scss';

const mapStateToProps = (state, context) => {
  const ahState = selectDataEventsHistoryByStateId(state, context.stateId) || {};

  return {
    list: ahState.list,
    isLoading: ahState.isLoading,
    columns: isEmpty(ahState.columns) ? EventsHistoryService.config.columns : ahState.columns,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  getEventsHistory: payload => dispatch(getEventsHistory(payload)),
  filterEventsHistory: payload => dispatch(filterEventsHistory(payload))
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
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  };

  static defaultProps = {
    className: '',
    isSmallMode: false,
    isMobile: false,
    isLoading: false
  };

  state = {
    contentHeight: 0
  };

  className = 'ecos-action-history';

  _filter = React.createRef();

  componentDidMount() {
    this.getEventsHistory();
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
      <React.Fragment>
        <div ref={this._filter}>
          {/*{(isMobile || isSmallMode) && (
            <DropdownFilter columns={columns} className={`${this.className}__filter`} onFilter={this.onFilter} />
          )}*/}
        </div>
        <Scrollbars
          style={{ height: contentHeight || '100%' }}
          className={this.className}
          renderTrackVertical={props => <div {...props} className={`${this.className}__v-scroll`} />}
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
              className={className}
              onFilter={this.onFilter}
            />
          </DefineHeight>
        </Scrollbars>
      </React.Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EventsHistory);
