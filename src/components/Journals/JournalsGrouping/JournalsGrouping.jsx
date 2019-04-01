import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Grouping from '../../Grouping/Grouping';
import PanelBar from '../../common/PanelBar/PanelBar';
import { reloadGrid, setGrouping } from '../../../actions/journals';
import { t } from '../../../helpers/util';

import './JournalsGrouping.scss';

const mapStateToProps = state => ({
  journalConfig: state.journals.journalConfig,
  grouping: state.journals.grouping
});

const mapDispatchToProps = dispatch => ({
  setGrouping: grouping => dispatch(setGrouping(grouping)),
  reloadGrid: options => dispatch(reloadGrid(options))
});

class JournalsGrouping extends Component {
  onGrouping = grouping => {
    this.props.setGrouping(grouping);

    if (grouping.length) {
      let columns = Array.from(grouping);
      const attributes = columns.map(col => col['attribute']);
      columns.push({
        attribute: 'someSumField',
        schema: 'sum(contracts:agreementAmount)',
        text: 'Сумма'
      });

      this.props.reloadGrid({
        columns,
        predicate: {
          t: 'eq',
          att: '_type',
          val: 'contracts:agreement'
        },
        groupBy: [attributes.join('&')],
        criteria: []
      });
    } else {
      const {
        columns,
        meta: { criteria }
      } = this.props.journalConfig;
      this.props.reloadGrid({ columns, predicate: [], groupBy: null, criteria });
    }
  };

  render() {
    const {
      journalConfig: { columns = [] },
      grouping
    } = this.props;

    return (
      <PanelBar
        header={t('journals.grouping.header')}
        className={'journals-grouping__panel-bar'}
        css={{ headerClassName: 'panel-bar__header_full' }}
      >
        <Grouping
          className={'journals-grouping'}
          list={columns}
          grouping={grouping}
          valueField={'attribute'}
          titleField={'text'}
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
