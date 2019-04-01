import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import ColumnsSetup from '../../ColumnsSetup/ColumnsSetup';
import PanelBar from '../../common/PanelBar/PanelBar';
import { reloadGrid, setGrouping } from '../../../actions/journals';
import { t } from '../../../helpers/util';

import './JournalsColumnsSetup.scss';

const mapStateToProps = state => ({
  journalConfig: state.journals.journalConfig,
  grouping: state.journals.grouping
});

const mapDispatchToProps = dispatch => ({
  setGrouping: grouping => dispatch(setGrouping(grouping)),
  reloadGrid: options => dispatch(reloadGrid(options))
});

class JournalsColumnsSetup extends Component {
  render() {
    const {
      journalConfig: { columns = [] }
    } = this.props;

    return (
      <PanelBar header={t('journals.columns-setup.header')} css={{ headerClassName: '' }}>
        <ColumnsSetup
          classNameToolbar={'ecos-journals-columns-setup__toolbar'}
          rows={columns}
          valueField={'attribute'}
          titleField={'text'}
        />
      </PanelBar>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsColumnsSetup);
