import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Filters from '../../Filters/Filters';
import PanelBar from '../../common/PanelBar/PanelBar';
import { trigger } from '../../../helpers/util';

import './JournalsFilters.scss';

const mapStateToProps = state => ({
  journalSetting: state.journals.journalSetting,
  journalConfig: state.journals.journalConfig
});

class JournalsFilters extends Component {
  onChangeFilters = predicate => {
    trigger.call(this, 'onChange', predicate);
  };

  render() {
    const { predicate } = this.props.journalSetting;
    const { columns = [] } = this.props.journalConfig;

    if (!columns.length) {
      return null;
    }

    return (
      <PanelBar
        header={'Фильтрация'}
        className={'ecos-journals-filters__panel-bar'}
        css={{ headerClassName: 'panel-bar__header_full panel-bar__header_upper' }}
      >
        <Filters predicate={predicate} columns={columns} className={'ecos-journals-filters'} onChange={this.onChangeFilters} />
      </PanelBar>
    );
  }
}

export default connect(mapStateToProps)(JournalsFilters);
