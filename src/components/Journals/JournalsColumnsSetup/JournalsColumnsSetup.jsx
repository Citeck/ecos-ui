import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import ColumnsSetup from '../../ColumnsSetup/ColumnsSetup';
import PanelBar from '../../common/PanelBar/PanelBar';
import { t, trigger } from '../../../helpers/util';

import './JournalsColumnsSetup.scss';

const mapStateToProps = state => ({
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({});

class JournalsColumnsSetup extends Component {
  onOrder = columns => {
    this.onChange({ columns });
  };

  onChangeVisible = columns => {
    this.onChange({ columns });
  };

  onChangeSortBy = sortBy => {
    sortBy = [sortBy];
    this.onChange({ sortBy });
  };

  onChange = ({ columns, sortBy }) => {
    trigger.call(this, 'onChange', { columns, sortBy });
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
        header={t('journals.columns-setup.header')}
        className={'ecos-journals-columns-setup__panel-bar'}
        css={{ headerClassName: 'panel-bar__header_upper' }}
      >
        <ColumnsSetup
          classNameToolbar={'ecos-journals-columns-setup__toolbar'}
          valueField={'attribute'}
          titleField={'text'}
          columns={columns}
          onOrder={this.onOrder}
          onChangeVisible={this.onChangeVisible}
          onChangeSortBy={this.onChangeSortBy}
        />
      </PanelBar>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsColumnsSetup);
