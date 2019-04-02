import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import ColumnsSetup from '../../ColumnsSetup/ColumnsSetup';
import PanelBar from '../../common/PanelBar/PanelBar';
import { reloadGrid } from '../../../actions/journals';
import { t } from '../../../helpers/util';

import './JournalsColumnsSetup.scss';

const mapStateToProps = state => ({
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  reloadGrid: options => dispatch(reloadGrid(options))
});

class JournalsColumnsSetup extends Component {
  onOrder = columns => {
    this.props.reloadGrid({ columns });
  };

  onChangeVisible = columns => {
    this.props.reloadGrid({ columns });
  };

  onChangeSortBy = sortBy => {
    sortBy = [sortBy];
    this.props.reloadGrid({ sortBy });
  };

  render() {
    const {
      journalConfig: { columns = [] }
    } = this.props;

    if (!columns.length) {
      return null;
    }

    return (
      <PanelBar header={t('journals.columns-setup.header')}>
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
