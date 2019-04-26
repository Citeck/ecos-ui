import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Grouping from '../../Grouping/Grouping';
import PanelBar from '../../common/PanelBar/PanelBar';
import { t, trigger } from '../../../helpers/util';

import './JournalsGrouping.scss';

const mapStateToProps = state => ({
  journalSetting: state.journals.journalSetting
});

class JournalsGrouping extends Component {
  onGrouping = grouping => {
    trigger.call(this, 'onChange', grouping);
  };

  render() {
    const { columns, groupBy } = this.props;

    return (
      <PanelBar
        header={t('journals.grouping.header')}
        className={'journals-grouping__panel-bar'}
        css={{ headerClassName: 'panel-bar__header_upper' }}
      >
        <Grouping
          className={'journals-grouping'}
          groupBy={groupBy}
          list={columns}
          grouping={[]}
          valueField={'attribute'}
          titleField={'text'}
          onGrouping={this.onGrouping}
        />
      </PanelBar>
    );
  }
}

export default connect(mapStateToProps)(JournalsGrouping);
