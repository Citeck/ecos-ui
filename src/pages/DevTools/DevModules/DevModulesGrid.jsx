import React, { useContext, useRef } from 'react';
import get from 'lodash/get';

import { Grid } from '../../../components/common/grid';
import { renderAction } from '../../../components/common/grid/InlineTools/helpers';
import InlineToolsDisconnected from '../../../components/common/grid/InlineTools/InlineToolsDisconnected';
import recordActions from '@/components/core/Records/actions/recordActions';

import { DevModulesContext } from './DevModulesContext';

// Row ids are record refs of ecos modules ('uiserv/form@some.form'), so the lodash path has to be
// an ARRAY: a string path would be split on the dots and brackets of the ref (COREDEV-492).
export const getRowActions = (actions, rowId) => get(actions, ['forRecord', rowId], []);

const DevModulesGrid = () => {
  const context = useContext(DevModulesContext);
  const { state } = context;
  const { actions, columns, data } = state;

  const gridWrapperRef = useRef(null);

  const renderInlineTools = settings => {
    const rowId = get(settings, 'row.id', null);
    if (!rowId) {
      return null;
    }

    const rowActions = getRowActions(actions, rowId);
    const buttons = rowActions.map((action, idx) =>
      renderAction(
        {
          ...action,
          onClick: () => recordActions.execForRecord(rowId, action)
        },
        idx
      )
    );

    return <InlineToolsDisconnected tools={buttons} {...settings} />;
  };

  return (
    <div ref={gridWrapperRef}>
      <Grid scrollable={false} data={data} columns={columns} inlineTools={renderInlineTools} />
    </div>
  );
};

export default DevModulesGrid;
