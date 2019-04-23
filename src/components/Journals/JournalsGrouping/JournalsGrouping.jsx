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
      this.props.reloadGrid({ columns, groupBy: [columns.map(col => col['attribute']).join('&')] });
    } else {
      const { columns } = this.props.journalConfig;
      this.props.reloadGrid({ columns, groupBy: null });
    }
  };

  render() {
    const {
      journalConfig: { columns = [] },
      grouping
    } = this.props;

    if (!columns.length) {
      return null;
    }

    return (
      <PanelBar
        header={t('journals.grouping.header')}
        className={'journals-grouping__panel-bar'}
        css={{ headerClassName: 'panel-bar__header_upper' }}
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
