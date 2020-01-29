import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import Pagination from '../../common/Pagination/Pagination';
import { PAGINATION_SIZES } from '../../Journals/constants';
import { reloadGrid } from '../../../actions/journals';
import { wrapArgs } from '../../../helpers/redux';
import UserLocalSettingsService, { JournalProps } from '../../../services/userLocalSettings';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    grid: newState.grid
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    reloadGrid: options => dispatch(reloadGrid(w(options)))
  };
};

class JournalsPagination extends Component {
  static propTypes = {
    className: PropTypes.string,
    grid: PropTypes.object,
    hasPageSize: PropTypes.bool,
    reloadGrid: PropTypes.func
  };

  changePage = pagination => {
    this.reloadGrid(pagination);
  };

  reloadGrid = pagination => {
    this.props.reloadGrid({ pagination });
  };

  render() {
    const {
      grid: { total, pagination, groupBy },
      hasPageSize,
      className
    } = this.props;

    const cssClasses = classNames('ecos-journal-dashlet__pagination', className);

    if (groupBy && groupBy.length) {
      return null;
    }

    return (
      <Pagination
        className={cssClasses}
        total={total}
        {...pagination}
        sizes={PAGINATION_SIZES}
        onChange={this.changePage}
        hasPageSize={hasPageSize}
      />
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsPagination);
