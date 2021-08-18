import React from 'react';
import { connect } from 'react-redux';

import { extractLabel } from '../../../helpers/util';
import { selectBoardConfig } from '../../../selectors/kanban';

import './style.scss';

function mapStateToProps(state, props) {
  return selectBoardConfig(state, props.stateId);
}

function mapDispatchToProps(dispatch) {
  return {};
}

class Kanban extends React.Component {
  render() {
    const { columns = [] } = this.props;

    return (
      <div className="ecos-kanban">
        {columns.map(col => (
          <div className="ecos-kanban__column" key={col.id}>
            <div className="ecos-kanban__column-name">{extractLabel(col.name)}</div>
          </div>
        ))}
      </div>
    );
  }
}

export default connect(mapStateToProps)(Kanban);
