import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import React, { useCallback } from 'react';

import { execGroupAction, setFileViewerLastClicked, setFileViewerSelected } from '@/actions/docLib';
import PointsLoader from '@/components/common/PointsLoader/PointsLoader';
import { IcoBtn } from '@/components/common/btns';
import { DropdownOuter } from '@/components/common/form/Dropdown';
import { t } from '@/helpers/export/util';
import { selectDocLibGroupActions } from '@/selectors/docLib';

import { DocLibLabels } from '../constants';
import { useDocLibDispatch } from '../hooks/useDocLibDispatch';
import { useDocLibSelector } from '../hooks/useDocLibSelector';
import { FileItemAction, GroupActionsState } from '../types';

import './SelectionBar.scss';

interface SelectionBarProps {
  stateId: string;
  isMobile: boolean;
  selectedCount: number;
}

const SelectionBar = ({ stateId, isMobile, selectedCount }: SelectionBarProps) => {
  const dispatchW = useDocLibDispatch(stateId);
  const groupActions = useDocLibSelector<GroupActionsState>(selectDocLibGroupActions, stateId);

  const onActionClick = useCallback((action: FileItemAction) => dispatchW(execGroupAction, action), [dispatchW]);

  const onClearSelection = useCallback(() => {
    dispatchW(setFileViewerSelected, []);
    dispatchW(setFileViewerLastClicked, null);
  }, [dispatchW]);

  const isReady = get(groupActions, 'isReady', true);
  const actions: FileItemAction[] = get(groupActions, 'forRecords.actions') || [];

  const inlineActions = actions.filter(action => action.icon);
  const dropdownActions = actions.filter(action => !action.icon);

  return (
    <div className={classNames('citeck-doclib-selection-bar', { 'citeck-doclib-selection-bar_mobile': isMobile })}>
      <IcoBtn
        icon="icon-small-close"
        className="citeck-doclib-selection-bar__clear"
        title={t(DocLibLabels.CLEAR_SELECTION)}
        onClick={onClearSelection}
      />
      <span className="citeck-doclib-selection-bar__count">{t(DocLibLabels.SELECTED_COUNT, { count: selectedCount })}</span>

      <div className="citeck-doclib-selection-bar__actions">
        {!isReady && <PointsLoader className="citeck-doclib-selection-bar__loader" />}

        {isReady && !isEmpty(actions) && (
          <>
            {inlineActions.map((action, idx) => (
              <IcoBtn
                key={action.id || idx}
                icon={action.icon}
                title={action.pluralName}
                className="citeck-doclib-selection-bar__action-btn"
                onClick={() => onActionClick(action)}
              />
            ))}

            {!!dropdownActions.length && (
              <DropdownOuter
                className="citeck-doclib-selection-bar__more"
                source={dropdownActions}
                valueField="id"
                titleField="pluralName"
                keyFields={['id', 'formRef', 'pluralName']}
                isStatic
                onChange={(action: FileItemAction) => onActionClick(action)}
              >
                <IcoBtn invert icon="icon-small-down" className="citeck-doclib-selection-bar__more-btn">
                  {t(isMobile ? DocLibLabels.GROUP_ACTIONS_MOBILE : DocLibLabels.GROUP_ACTIONS)}
                </IcoBtn>
              </DropdownOuter>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SelectionBar;
