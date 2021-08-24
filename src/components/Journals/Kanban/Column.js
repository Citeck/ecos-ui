import React from 'react';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../helpers/export/util';
import { selectColumnProps } from '../../../selectors/kanban';
import { runAction } from '../../../actions/kanban';
import { InfoText } from '../../common';
import { Labels } from '../constants';
import Card from './Card';

class Column extends React.PureComponent {
  renderInfo = () => {
    const { records, isFirstLoading, error } = this.props;
    let text;

    if (error) {
      text = error;
    } else if (isFirstLoading) {
      text = ' ';
    } else if (isEmpty(records)) {
      text = t(Labels.KB_COL_NO_CARD);
    }

    if (!text) {
      return null;
    }

    return (
      <div className="ecos-kanban__column-card_empty">
        <InfoText text={text} noIndents />
      </div>
    );
  };

  renderContentCard = (record, index) => {
    const { formProps, readOnly, actions, runAction } = this.props;

    return (
      <Card
        key={record.cardId}
        data={record}
        formProps={formProps}
        readOnly={readOnly}
        actions={actions[record.cardId]}
        runAction={runAction}
      />
    );
  };

  render() {
    const { records = [] } = this.props;

    return (
      <div className="ecos-kanban__column">
        <div className="ecos-kanban__column-card-list">
          {records.map(this.renderContentCard)}
          {this.renderInfo()}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return selectColumnProps(state, props.stateId, props.columnIndex);
}

function mapDispatchToProps(dispatch, props) {
  return {
    runAction: (recordRef, action) => dispatch(runAction({ recordRef, action, stateId: props.stateId }))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Column);
