import React from 'react';

import BPMNViewer from '../ModelViewer/BPMNViewer';
import { t } from '../../helpers/util';
import Records from '../Records/Records';
import { Btn } from '../common/btns';
import { Labels } from './constants';

export class CamundaProcess extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      diagram: null,
      definitionKey: null
    };
  }

  componentDidMount() {
    this.designer = new BPMNViewer();

    this.getDiagram();
  }

  getDiagram = () => {
    const { processId } = this.props;

    Records.get(processId)
      .load(
        {
          diagram: 'processInstanceRef.definitionRef.definition',
          definitionKey: 'definitionKey'
        },
        true
      )
      .then(({ diagram, definitionKey }) => {
        this.setState({ diagram, definitionKey });
      });
  };

  render() {
    const { disabledCancelBP, handleCancelBP } = this.props;
    const { diagram, definitionKey } = this.state;

    return (
      <div className="ecos-camunda-process">
        <div className="ecos-camunda-process__content">
          {diagram &&
            this.designer.renderSheet({
              diagram,
              markedElement: definitionKey
            })}
        </div>
        <div className="ecos-business-process__actions">
          <Btn onClick={handleCancelBP} disabled={disabledCancelBP}>
            {t(Labels.BTN_CANCEL_BP)}
          </Btn>
        </div>
      </div>
    );
  }
}
