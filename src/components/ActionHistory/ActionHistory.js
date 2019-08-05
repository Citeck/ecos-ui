import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { isEmpty } from 'lodash';
import { DefineHeight } from '../common';
import { selectDataActionHistoryByStateId } from '../../selectors/actionHistory';
import { getActionHistory } from '../../actions/actionHistory';

import './style.scss';

const mapStateToProps = (state, context) => {
  const ahState = selectDataActionHistoryByStateId(state, context.stateId) || {};

  return {
    list: ahState.list,
    isLoading: ahState.isLoading,
    columns: ahState.columns
  };
};

const mapDispatchToProps = dispatch => ({
  getActionHistory: payload => dispatch(getActionHistory(payload))
});

class ActionHistory extends React.Component {
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

  className = 'ecos-action-history-list';

  componentDidMount() {
    this.getActionHistory();
  }

  getActionHistory = () => {
    const { getActionHistory, record, stateId } = this.props;

    getActionHistory({
      stateId,
      record
    });
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  render() {
    const { isLoading, isMobile, isSmallMode, className, height, minHeight, maxHeight, list } = this.props;
    const childProps = {
      className,
      isLoading,
      isMobile,
      isSmallMode
    };
    const { contentHeight } = this.state;
    console.log('list', list);
    return (
      <Scrollbars
        style={{ height: contentHeight || '100%' }}
        className={this.className}
        renderTrackVertical={props => <div {...props} className={`${this.className}__v-scroll`} />}
      >
        <DefineHeight
          fixHeight={height}
          maxHeight={maxHeight}
          minHeight={minHeight}
          isMin={isLoading || isEmpty(list)}
          getOptimalHeight={this.setHeight}
        >
          <div>***</div>
        </DefineHeight>
      </Scrollbars>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActionHistory);
