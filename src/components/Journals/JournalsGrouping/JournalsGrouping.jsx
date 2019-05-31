import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Grouping from '../../Grouping/Grouping';
import PanelBar from '../../common/PanelBar/PanelBar';
import { setGrouping } from '../../../actions/journals';
import { t } from '../../../helpers/util';

import './JournalsGrouping.scss';

const mapStateToProps = state => ({
  grouping: state.journals.grouping
});

const mapDispatchToProps = dispatch => ({
  setGrouping: grouping => dispatch(setGrouping(grouping))
});

class JournalsGrouping extends Component {
  onGrouping = grouping => {
    this.props.setGrouping(grouping);
  };

  render() {
    const { columns, grouping } = this.props;

    let groupingList = [];
    let aggregation = [];

    grouping.columns.forEach(groupingColumn => {
      const match = columns.filter(column => column.attribute === groupingColumn.attribute)[0];
      match ? groupingList.push(groupingColumn) : aggregation.push(groupingColumn);
    });

    return (
      <PanelBar
        header={t('journals.grouping.header')}
        className={'journals-grouping__panel-bar'}
        css={{ headerClassName: 'panel-bar__header_upper' }}
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
