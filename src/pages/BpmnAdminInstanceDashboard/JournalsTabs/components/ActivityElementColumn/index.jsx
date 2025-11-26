import React, { useContext, useEffect, useState } from 'react';

import { connect } from 'react-redux';

import BPMNViewer from '../../../../../components/ModelViewer/BPMNViewer';
import { selectInstanceMetaInfo } from '../../../../../selectors/instanceAdmin';
import { JOURNALS_TABS_BLOCK_CLASS } from '../../../constants';
import { InstanceContext } from '../../../InstanceContext';

const ElementColumn = ({ row, metaInfo, nameField = 'activityId' }) => {
  const [name, setName] = useState();
  const context = useContext(InstanceContext);

  useEffect(
    () => {
      if (!metaInfo || !metaInfo.bpmnDefinition) {
        return;
      }

      BPMNViewer.getElementName(metaInfo.bpmnDefinition, row[nameField]).then(name => {
        setName(name);
      });
    },
    [metaInfo]
  );

  if (!metaInfo || !metaInfo.bpmnDefinition) {
    return null;
  }

  const handleSelectActivity = () => {
    context.setActivityElement(row[nameField]);
  };

  return (
    <span className={`${JOURNALS_TABS_BLOCK_CLASS}__clickable-field`} onClick={handleSelectActivity}>
      {name}
    </span>
  );
};

const mapStateToProps = (store, props) => ({
  metaInfo: selectInstanceMetaInfo(store, props)
});

export const ActivityElementColumn = connect(mapStateToProps)(ElementColumn);
