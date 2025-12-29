import React, { useContext, useEffect, useState } from 'react';

import get from 'lodash/get';

import BPMNViewer from '../../../../../components/ModelViewer/BPMNViewer';
import { ProcessContext } from '../../../ProcessContext';

export const ActivityComponent = ({ row }) => {
  const [name, setName] = useState(row.activityId);
  const context = useContext(ProcessContext);

  useEffect(
    () => {
      const bpmnDef = get(context, 'selectedVersion.bpmnDefinition');
      if (!context || !context.selectedVersion || !bpmnDef) {
        return;
      }

      BPMNViewer.getElementName(bpmnDef, row.activityId).then(name => {
        setName(name);
      });
    },
    [context]
  );

  if (!context || !context.selectedVersion) {
    return null;
  }

  const handleSelectActivity = () => {
    context.setActivityElement(row.activityId);
  };

  return (
    <div className="bpmn-process__clickable-text" onClick={handleSelectActivity}>
      {name}
    </div>
  );
};
