import React, { Component } from 'react';
import { connect } from 'react-redux';

import ColumnsSetup from '../../ColumnsSetup/ColumnsSetup';
import PanelBar from '../../common/PanelBar/PanelBar';
import { setColumnsSetup } from '../../../actions/journals';
import { t } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';

import './JournalsColumnsSetup.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    columnsSetup: newState.columnsSetup
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setColumnsSetup: (columns, sortBy) => dispatch(setColumnsSetup(w({ columns, sortBy })))
  };
};

class JournalsColumnsSetup extends Component {
  onChange = ({ columns, sortBy }) => {
    this.props.setColumnsSetup(columns, sortBy);
  };

  render() {
    const {
      columnsSetup: { columns, sortBy }
    } = this.props;

    return (
      <PanelBar
        header={t('journals.columns-setup.header')}
        className={'ecos-journals-columns-setup__panel-bar'}
        css={{ headerClassName: 'panel-bar__header_upper' }}
        open={false}
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
