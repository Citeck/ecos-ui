import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import ColumnsSetup from '../../ColumnsSetup/ColumnsSetup';
import PanelBar from '../../common/PanelBar/PanelBar';
import { setColumnsSetup } from '../../../actions/journals';
import { t } from '../../../helpers/util';

import './JournalsColumnsSetup.scss';

const mapStateToProps = state => ({
  journalSetting: state.journals.journalSetting,
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  setColumnsSetup: (columns, sortBy) => dispatch(setColumnsSetup({ columns, sortBy }))
});

class JournalsColumnsSetup extends Component {
  onChange = ({ columns, sortBy }) => {
    this.props.setColumnsSetup(columns, sortBy);
  };

  render() {
    let { columns, sortBy, groupBy } = this.props.journalSetting;

    columns = groupBy.length ? this.props.journalConfig.columns : columns;

    columns = columns.map(col => ({ ...col }));
    sortBy = sortBy.map(sort => ({ ...sort }));

    this.onChange({ columns, sortBy });

    if (!columns.length) {
      return null;
    }

    return (
      <PanelBar
        header={t('journals.columns-setup.header')}
        className={'ecos-journals-columns-setup__panel-bar'}
        css={{ headerClassName: 'panel-bar__header_upper' }}
      >
        <ColumnsSetup
          classNameToolbar={'ecos-journals-columns-setup__toolbar'}
          valueField={'attribute'}
          titleField={'text'}
          columns={columns}
          sortBy={sortBy}
          onChange={this.onChange}
        />
      </PanelBar>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsColumnsSetup);
