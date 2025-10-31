import React from 'react';

import { ActionTypes } from '../Records/actions/constants';
import recordActions from '../Records/actions/recordActions';
import { CamundaProcess } from './CamundaProcess';
import { FlowableProcess } from './FlowableProcess';
import { isFlowableProcess } from './util';
import { Labels } from './constants';

import './style.scss';

export default class BusinessProcessViewer extends React.Component {
  state = {
    disabledCancelBP: false
  };

  handleCancelBP = () => {
    const { recordId } = this.props;

    this.setState({ disabledCancelBP: true });

    recordActions
      .execForRecord(recordId, {
        type: ActionTypes.CANCEL_WORKFLOW,
        confirm: { title: Labels.MSG_CANCEL_BP }
      })
      .then(success => !success && this.setState({ disabledCancelBP: false }));
  };

  render() {
    const { recordId, processId, modal } = this.props;
    const { disabledCancelBP } = this.state;

    return (
      <>
        {isFlowableProcess(recordId) && (
          <FlowableProcess recordId={recordId} disabledCancelBP={disabledCancelBP} handleCancelBP={this.handleCancelBP} />
        )}
        {!isFlowableProcess(recordId) && <CamundaProcess recordId={recordId} processId={processId} modal={modal} />}
      </>
    );
  }
}
