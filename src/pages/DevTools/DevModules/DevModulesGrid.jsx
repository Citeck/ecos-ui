import React, { useContext, useEffect, useState, useRef } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';

import { Grid } from '../../../components/common/grid';
import { renderAction } from '../../../components/common/grid/InlineTools/helpers';
import InlineToolsDisconnected from '../../../components/common/grid/InlineTools/InlineToolsDisconnected';
import recordActions from '../../../components/Records/actions/recordActions';

import { DevModulesContext } from './DevModulesContext';

const DevModulesGrid = () => {
  const context = useContext(DevModulesContext);
  const { state } = context;
  const { actions, columns, data } = state;

  const inlineToolsOffsetsInitState = { height: 0, top: 0, row: {} };
  const [inlineToolsOffsets, setInlineToolsOffsets] = useState(cloneDeep(inlineToolsOffsetsInitState));

  const gridWrapperRef = useRef(null);
  const resetInlineToolsOffsets = () => {
    setInlineToolsOffsets(cloneDeep(inlineToolsOffsetsInitState));
  };
  useEffect(() => {
    const wrapper = gridWrapperRef.current;
    wrapper.addEventListener('mouseleave', resetInlineToolsOffsets);
    return () => {
      wrapper.removeEventListener('mouseleave', resetInlineToolsOffsets);
    };
  });

  const renderInlineTools = () => {
    const rowId = get(inlineToolsOffsets, 'row.id', null);
    if (!rowId) {
      return null;
    }

    const rowActions = get(actions, `forRecord.${rowId}`, []);
    const buttons = rowActions.map((action, idx) =>
      renderAction(
        {
          ...action,
          onClick: () => recordActions.execForRecord(rowId, action)
        },
        idx
      )
    );

    return <InlineToolsDisconnected tools={buttons} {...inlineToolsOffsets} />;
  };

  return (
    <div ref={gridWrapperRef}>
      <Grid scrollable={false} data={data} columns={columns} onChangeTrOptions={setInlineToolsOffsets} inlineTools={renderInlineTools} />
    </div>
  );
};

export default DevModulesGrid;
