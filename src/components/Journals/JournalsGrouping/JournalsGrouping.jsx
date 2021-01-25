import React, { Component } from 'react';
import { connect } from 'react-redux';

import Grouping from '../../Grouping/Grouping';
import PanelBar from '../../common/PanelBar/PanelBar';
import { setGrouping } from '../../../actions/journals';
import { t } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';

import './JournalsGrouping.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    grouping: newState.grouping,
    columnsSetup: newState.columnsSetup
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setGrouping: grouping => dispatch(setGrouping(w(grouping)))
  };
};

class JournalsGrouping extends Component {
  onGrouping = grouping => {
    this.props.setGrouping(grouping);
  };

  render() {
    const { grouping, columnsSetup } = this.props;

    let groupingList = [];
    let aggregation = [];

    const columns = columnsSetup.columns.filter(c => c.default);

    grouping.columns.forEach(groupingColumn => {
      const match = columns.filter(column => column.attribute === groupingColumn.attribute)[0];
      match ? groupingList.push(groupingColumn) : aggregation.push(groupingColumn);
    });

    return (
      <PanelBar
        header={t('journals.grouping.header')}
        className={'journals-grouping__panel-bar'}
        css={{ headerClassName: 'panel-bar__header_upper' }}
        open={false}
      >
        <Grouping
          className={'journals-grouping'}
          groupBy={grouping.groupBy}
          list={columns}
          grouping={groupingList}
          aggregation={aggregation}
          valueField={'attribute'}
          titleField={'text'}
          showAggregation={grouping.groupBy.length}
          onGrouping={this.onGrouping}
        />
      </PanelBar>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsGrouping);
