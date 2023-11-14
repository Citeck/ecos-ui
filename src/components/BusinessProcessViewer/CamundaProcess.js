import React from 'react';

import BPMNViewer from '../ModelViewer/BPMNViewer';
import { t } from '../../helpers/util';
import PageService from '../../services/PageService';
import { URL } from '../../constants';
import Records from '../Records/Records';
import { Btn } from '../common/btns';
import { Labels } from './constants';

export class CamundaProcess extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      diagram: null,
      definitionKey: null,
      workFlowId: null,
      hasGoAdminRights: false
    };
  }

  componentDidMount() {
    this.designer = new BPMNViewer();

    this.getDiagram();
    this.fetchGoAdminRights();
  }

  getDiagram = () => {
    const { processId } = this.props;

    Records.get(processId)
      .load(
        {
          diagram: 'processInstanceRef.ecosDefRev.definition',
          definitionKey: 'definitionKey'
        },
        true
      )
      .then(({ diagram, definitionKey }) => {
        this.setState({ diagram, definitionKey });
      });
  };

  fetchGoAdminRights = () => {
    const { processId } = this.props;

    return Records.get(processId)
      .load(
        {
          hasGoAdminRights: 'workflow.ecosDefRev.processDefRef.permissions._has.bpmn-process-instance-read?bool!',
          workFlowId: 'workflow?id'
        },
        true
      )
      .then(({ hasGoAdminRights, workFlowId }) => this.setState({ hasGoAdminRights, workFlowId }));
  };

  handleGoBpmnAdmin = () => {
    const { workFlowId } = this.state;
    const { modal } = this.props;

    modal.close();
    PageService.changeUrlLink(`${URL.BPMN_ADMIN_INSTANCE}?recordRef=${workFlowId}`, {
      openNewTab: true
    });
  };

  render() {
    const { diagram, definitionKey, hasGoAdminRights } = this.state;

    return (
      <div className="ecos-camunda-process">
        <div className="ecos-camunda-process__content">
          {diagram &&
            this.designer.renderSheet({
              diagram,
              markedElement: definitionKey
            })}
        </div>
        {hasGoAdminRights && (
          <div className="ecos-business-process__actions">
            <Btn onClick={this.handleGoBpmnAdmin}>{t(Labels.BPMN_ADMIN)}</Btn>
          </div>
        )}
      </div>
    );
  }
}
