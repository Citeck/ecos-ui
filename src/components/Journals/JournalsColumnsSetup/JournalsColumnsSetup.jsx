import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import ColumnsSetup from '../../ColumnsSetup/ColumnsSetup';
import PanelBar from '../../common/PanelBar/PanelBar';
import { t, trigger } from '../../../helpers/util';

import './JournalsColumnsSetup.scss';

const mapStateToProps = state => ({});

class JournalsColumnsSetup extends Component {
  constructor(props) {
    super(props);

    this.columns = props.columns.map(col => ({ ...col }));
    this.sortBy = props.sortBy.map(sort => ({ ...sort }));
  }

  onChange = ({ columns, sortBy }) => {
    trigger.call(this, 'onChange', { columns, sortBy });
  };

  render() {
    const columns = this.columns;
    const sortBy = this.sortBy;

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
