import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Filters from '../../Filters/Filters';
import PanelBar from '../../common/PanelBar/PanelBar';
import { trigger } from '../../../helpers/util';

import './JournalsFilters.scss';

const mapStateToProps = state => ({
  journalConfig: state.journals.journalConfig
});
const mapDispatchToProps = dispatch => ({});

class JournalsFilters extends Component {
  onChangeFilters = predicate => {
    trigger.call(this, 'onChange', predicate);
  };

  render() {
    const {
      journalConfig: { columns = [] }
    } = this.props;

    if (!columns.length) {
      return null;
    }

    return (
      <PanelBar
        header={'Фильтрация'}
        className={'ecos-journals-filters__panel-bar'}
        css={{ headerClassName: 'panel-bar__header_full panel-bar__header_upper' }}
      >
        <Filters columns={columns} className={'ecos-journals-filters'} onChange={this.onChangeFilters} />
      </PanelBar>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsFilters);
