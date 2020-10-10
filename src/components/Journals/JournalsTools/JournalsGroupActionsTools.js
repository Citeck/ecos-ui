import React from 'react';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { IcoBtn } from '../../common/btns';
import { DropdownOuter } from '../../common/form/Dropdown';
import { t } from '../../../helpers/export/util';
import { Tools } from '../../common/grid';

export default React.memo(function JournalsGroupActionsTools(props) {
  const { isMobile, selectAllRecordsVisible, selectAllRecords, grid, selectedRecords, onExecuteAction, onGoTo, onSelectAll } = props;

  if (isEmpty(selectedRecords) && !selectAllRecords) {
    return;
  }

  const total = get(grid, 'total', 0);
  const forRecords = get(grid, 'actions.forRecords', {});
  const forQuery = get(grid, 'actions.forQuery', {});

  const forRecordsInlineActions = [];
  const forRecordsDropDownActions = [];
  const groupActions = (selectAllRecords ? forQuery.actions : forRecords.actions) || [];

  for (let action of groupActions) {
    if (action.icon) {
      forRecordsInlineActions.push(action);
    } else {
      forRecordsDropDownActions.push(action);
    }
  }

  const tools = forRecordsInlineActions.map(action => (
    <IcoBtn
      icon={action.icon}
      className="ecos-journal__tool ecos-btn_i_sm ecos-btn_grey4 ecos-btn_hover_t-dark-brown"
      title={action.pluralName}
      onClick={() => onExecuteAction(action)}
    />
  ));

  if (forRecordsDropDownActions.length) {
    tools.push(
      <DropdownOuter
        className="ecos-journal__tool-group-dropdown grid-tools__item_left_5"
        source={forRecordsDropDownActions}
        valueField={'id'}
        titleField={'pluralName'}
        keyFields={['id', 'formRef', 'pluralName']}
        isStatic
        onChange={action => onExecuteAction(action)}
      >
        <IcoBtn
          invert
          icon={'icon-small-down'}
          className="ecos-journal__tool-group-btn dashlet__btn ecos-btn_extra-narrow grid-tools__item_select-group-actions-btn"
          onClick={onGoTo}
        >
          {t(isMobile ? 'grid.tools.group-actions-mobile' : 'grid.tools.group-actions')}
        </IcoBtn>
      </DropdownOuter>
    );
  }

  return (
    <Tools
      onSelectAll={onSelectAll}
      selectAllVisible={selectAllRecordsVisible}
      selectAll={selectAllRecords}
      total={total}
      className="ecos-journal__group-actions grid-tools_r_12"
      tools={tools}
    />
  );
});
