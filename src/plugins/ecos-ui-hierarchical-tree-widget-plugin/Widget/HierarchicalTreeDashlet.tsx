import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import React, { useState, useEffect } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';

import SettingsWidget from './Settings';
import TreeNode, { type TreeNode as TreeNodeType } from './TreeNode';
import { createCategoryFormId, Labels, tooltipIdCreate, tooltipIdSettings } from './constants';
import EmptyIcon from './icons/EmptyIcon';

import { fetchBreadcrumbs, reloadGrid } from '@/actions/journals';
import FormManager from '@/components/EcosForm/FormManager';
// @ts-ignore
import Records from '@/components/Records';
import { Icon, Tooltip } from '@/components/common';
import { Btn } from '@/components/common/btns';
import { BaseWidgetProps } from '@/components/widgets/BaseWidget';
import { JournalUrlParams as JUP, SourcesId } from '@/constants';
import { getStateId, wrapArgs } from '@/helpers/store';
import { getRecordRef, getSearchParams, getWorkspaceId, updateCurrentUrl } from '@/helpers/urls';
import { isMobileDevice, t, getCurrentUserName, getMLValue } from '@/helpers/util';
import { Events } from '@/services/PageService';
import { MLTextType } from '@/types/components';
import { Dispatch, RootState } from '@/types/store';

import '@/components/Dashlet/Dashlet.scss';
import './style.scss';

interface HierarchicalTreeWidget extends BaseWidgetProps {
  stateId: string;
  journalId?: string;
  label?: MLTextType | string;
  reloadGrid: () => void;
  fetchBreadcrumbs: () => void;
  config?: BaseWidgetProps['config'] & { label: HierarchicalTreeWidget['label'] };
}

const HierarchicalTreeWidget = ({
  record: initialRecordRef,
  isSameHeight,
  reloadGrid,
  label,
  stateId,
  id,
  onSave,
  fetchBreadcrumbs,
  config
}: HierarchicalTreeWidget) => {
  const journalId = String(get(getSearchParams(), JUP.JOURNAL_ID, ''));
  const isJournalMode = !!journalId;
  const sourceId = isJournalMode ? SourcesId.CATEGORY : SourcesId.WIKI;
  const rootRecord = isJournalMode ? 'null' : `${SourcesId.WIKI}@${getWorkspaceId()}$ROOT`;

  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [isOpenSettings, setIsOpenSettings] = useState<boolean>(false);
  const [recordRef, setRecordRef] = useState<string | null>(
    isJournalMode ? String(get(getSearchParams(), JUP.RECORD_REF, '')) : initialRecordRef
  );
  const [records, setRecords] = useState<TreeNodeType[]>([]);

  useEffect(() => {
    if (isJournalMode && stateId && isFunction(reloadGrid)) {
      reloadGrid();
    }
  }, [recordRef]);

  useEffect(() => {
    fetchRecords().then(({ records = [] }) => {
      setRecords(records);
    });

    // @ts-ignore
    Records.get(`${SourcesId.PERSON}@${getCurrentUserName()}`)
      .load('isAdmin?bool')
      .then((value: boolean) => {
        if (!value) {
          // @ts-ignore
          Records.get(`${sourceId}@${getWorkspaceId()}$ROOT`)
            .load('permissions._has.Write?bool')
            .then((value: boolean) => setCanEdit(value));
        } else {
          setCanEdit(value);
        }
      });

    document.addEventListener(Events.CHANGE_URL_LINK_EVENT, () => {
      const newRecordRef = getRecordRef();
      newRecordRef && setRecordRef(newRecordRef);
    });

    return () => {
      document.removeEventListener(Events.CHANGE_URL_LINK_EVENT, () => {});
    };
  }, []);

  const fetchRecords = (parent?: string) => {
    const dashboardQuery = {
      ecosType: 'wiki',
      query: {
        t: 'eq',
        a: '_parent',
        val: parent || rootRecord
      }
    };

    const journalQuery = {
      sourceId: SourcesId.CATEGORY,
      query: {
        t: 'eq',
        a: '_parent',
        v: parent || `${SourcesId.JOURNAL}@${journalId}`
      }
    };

    // @ts-ignore
    return Records.query(
      { ...(isJournalMode ? journalQuery : dashboardQuery), language: 'predicate' },
      {
        name: '_disp',
        parent: '_parent?id',
        children: 'children[]{id?localId,name:_disp,parent:_parent?id,children:children[]?id}',
        id: 'id'
      }
    );
  };

  const create = async (parent?: string) => {
    FormManager.openFormModal({
      ...(isJournalMode && { formId: createCategoryFormId }),
      record: `${sourceId}@`,
      title: t(isJournalMode ? Labels.MODAL_TITLE_JOURNAL_CREATE : Labels.MODAL_TITLE_DASHBOARD_CREATE),
      attributes: {
        _parent: isJournalMode ? `${SourcesId.JOURNAL}@${journalId}` : parent || rootRecord,
        _parentAtt: 'children'
      },
      onSubmit: () => {
        fetchRecords().then(({ records = [] }) => {
          setRecords(records);
        });
      }
    });
  };

  const renderTreeContent = () =>
    records.length === 0 ? (
      <div className="ecos-hierarchical-tree-widget-empty">
        <EmptyIcon />
        <p>{t(Labels.NO_DATA)}</p>
        {canEdit && <Btn onClick={() => create()}>{t(Labels.ADD)}</Btn>}
      </div>
    ) : (
      <div className="ecos-hierarchical-tree-widget-body">
        <ul className="tree">
          {records.map(record => (
            <li
              key={record.id}
              className={classNames('parent-tree', {
                'parent-tree__active': recordRef && recordRef.includes(record.id),
                'parent-tree__no-children': record.children.length === 0
              })}
              onClick={(event: React.MouseEvent<HTMLElement>) => {
                event.preventDefault();
                if (record.children.length === 0) {
                  updateCurrentUrl({ recordRef: `${sourceId}@${record.id}` });
                }
              }}
            >
              <TreeNode
                toggleOpen={() => updateCurrentUrl({ recordRef: `${sourceId}@${record.id}` })}
                updateRootChilds={childs => setRecords(childs)}
                rootRecord={rootRecord}
                recordRef={recordRef}
                node={record}
                onFetchChildren={fetchRecords}
                canEdit={canEdit}
                records={records}
                setRecords={setRecords}
                initialRecordRef={initialRecordRef}
                reloadGrid={reloadGrid}
                callbackSubmitForm={isJournalMode ? fetchBreadcrumbs : () => null}
              />
            </li>
          ))}
        </ul>
      </div>
    );

  const renderContent = () =>
    isOpenSettings ? (
      <SettingsWidget
        stateId={stateId}
        onClose={() => setIsOpenSettings(false)}
        label={label || config?.label}
        id={id}
        isJournalMode={isJournalMode}
        onSave={onSave}
        config={config}
      />
    ) : (
      renderTreeContent()
    );

  const renderActions = () => (
    <div className="ecos-hierarchical-tree-widget__structure-actions">
      {!isOpenSettings && (
        <Tooltip uncontrolled text={t(Labels.ADD_GROUP)} target={tooltipIdCreate} off={isMobileDevice()}>
          <div id={tooltipIdCreate} className="ecos-hierarchical-tree-widget__structure-actions_btn" onClick={() => create()}>
            <Icon className="icon-plus" />
          </div>
        </Tooltip>
      )}
      <Tooltip uncontrolled text={t(Labels.SETTINGS)} target={tooltipIdSettings} off={isMobileDevice()}>
        <div
          id={tooltipIdSettings}
          className={classNames('ecos-hierarchical-tree-widget__structure-actions_btn', { active: isOpenSettings })}
          onClick={() => setIsOpenSettings(!isOpenSettings)}
        >
          <Icon className="icon-settings" />
        </div>
      </Tooltip>
    </div>
  );

  return (
    <div
      className={classNames('ecos-hierarchical-tree-widget', {
        fullHeight: isSameHeight
      })}
    >
      <div className="ecos-hierarchical-tree-widget-header">
        <h4
          onClick={(event: React.MouseEvent<HTMLElement>) => {
            event.preventDefault();
            updateCurrentUrl({ recordRef: rootRecord });
          }}
        >
          {isOpenSettings ? t(Labels.SETTINGS) : t(getMLValue(label || config?.label)) || t(Labels.TITLE_JOURNAL)}
        </h4>
        {canEdit && renderActions()}
      </div>
      {isSameHeight ? (
        <Scrollbars
          className="dashlet__same-scrollbar"
          renderTrackVertical={(props: React.HTMLAttributes<HTMLDivElement>) => (
            <div {...props} className="dashlet__same-scrollbar_track" />
          )}
        >
          {renderContent()}
        </Scrollbars>
      ) : (
        renderContent()
      )}
    </div>
  );
};

const mapStateToProps = (_: RootState, props: BaseWidgetProps) => ({
  stateId: props.stateId || getStateId(props)
});

const mapDispatchToProps = (
  dispatch: Dispatch,
  props: BaseWidgetProps & { journalId: HierarchicalTreeWidget['journalId'] }
): Pick<HierarchicalTreeWidget, 'reloadGrid' | 'fetchBreadcrumbs'> => {
  const w = wrapArgs<void>(props.stateId || getStateId({ ...props, id: props.journalId }));

  return {
    reloadGrid: () => dispatch(reloadGrid(w())),
    fetchBreadcrumbs: () => dispatch(fetchBreadcrumbs(w()))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(HierarchicalTreeWidget);
