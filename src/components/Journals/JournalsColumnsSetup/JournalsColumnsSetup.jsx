import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import ColumnsSetup from '../../ColumnsSetup/ColumnsSetup';
import PanelBar from '../../common/PanelBar/PanelBar';
import { t, trigger } from '../../../helpers/util';

import './JournalsColumnsSetup.scss';

const mapStateToProps = state => ({
  journalSetting: state.journals.journalSetting
});

class JournalsColumnsSetup extends Component {
  onChange = ({ columns, sortBy }) => {
    trigger.call(this, 'onChange', { columns, sortBy });
  };

  render() {
    let { columns, sortBy, journalSetting } = this.props;

    columns = journalSetting.columns.length ? journalSetting.columns : columns;
    sortBy = journalSetting.sortBy.length ? journalSetting.sortBy : sortBy;

    columns = columns.map(col => ({ ...col }));
    sortBy = sortBy.map(sort => ({ ...sort }));

    this.onChange({ columns, sortBy });

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

export default connect(mapStateToProps)(JournalsColumnsSetup);
