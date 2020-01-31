import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Filters from '../../Filters/Filters';
import PanelBar from '../../common/PanelBar/PanelBar';
import { setPredicate } from '../../../actions/journals';
import { t } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';

import './JournalsFilters.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    predicate: newState.predicate
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setPredicate: predicate => dispatch(setPredicate(w(predicate)))
  };
};

class JournalsFilters extends Component {
  onChangeFilters = predicate => {
    this.props.setPredicate(predicate);
  };

  render() {
    const { predicate, columns, sourceId, metaRecord } = this.props;

    return (
      <PanelBar header={t('filter-list.panel-header')} css={{ headerClassName: 'panel-bar__header_upper' }}>
        <Filters
          predicate={predicate}
          columns={columns}
          sourceId={sourceId}
          metaRecord={metaRecord}
          className="ecos-journals-filters"
          onChange={this.onChangeFilters}
        />
      </PanelBar>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsFilters);
