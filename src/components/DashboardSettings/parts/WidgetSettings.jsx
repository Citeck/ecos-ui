import React, { Suspense, useState, useEffect } from 'react';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import merge from 'lodash/merge';

import { SourcesId, SYSTEM_LIST, SystemJournals } from '../../../constants';
import { goToJournalsPage } from '../../../helpers/urls';
import { t } from '../../../helpers/export/util';
import DisplayElementService from '../../../services/DisplayElementService';
import { DialogManager } from '../../../components/common/dialogs';
import { Btn, IcoBtn } from '../../../components/common/btns';
import { InfoText, Loader } from '../../../components/common';
import { Checkbox, Select } from '../../../components/common/form';
import { ParserPredicate } from '../../../components/Filters/predicates';
import Filters from '../../../components/Filters/Filters';
import Components from '../../widgets/Components';
import { CONFIG_VERSION } from '../../../constants/dashboard';

const Labels = {
  MODAL_TITLE: 'widget-settings.title',
  MODAL_CANCEL: 'btn.cancel.label',
  MODAL_APPLY: 'btn.apply.label',
  JOURNAL_TYPE_GOTO: 'widget-settings.go-journal-types',
  DISPLAY_CONDITION_TITLE: 'widget-settings.display-condition',
  DISPLAY_CONDITION_NO_ATTR: 'widget-settings.dc-no-attributes',
  DISPLAY_CONDITION_NO_RULES: 'widget-settings.dc-no-rules',
  COLLAPSED_BY_DEFAULT_LABEL: 'widget-settings.collapsed-by-default',
  COLLAPSED_BY_DEFAULT_INFO: 'widget-settings.collapsed-by-default-info',
  FORM_MODE_DEFAULT_LABEL: 'widget-settings.collapsed-by-default',
  FORM_MODE_DEFAULT_INFO: 'widget-settings.collapsed-by-default-info',
  FORM_MODE_SELECT_LABEL: 'widget-settings.form-condition.label'
};

export const openWidgetSettings = props => {
  const { widget } = props;
  const hide = () => modalSettings.hide();
  const modalSettings = DialogManager.showCustomDialog({
    instance: 'widget-settings',
    title: t(Labels.MODAL_TITLE, { title: t(widget.label) }),
    body: <SettingsBody {...props} hideModal={hide} />
  });

  return modalSettings;
};

let loadedWidgetSettings = {};

const SettingsBody = props => {
  const { widget, executors, modelAttributes, hideModal } = props;

  const propertiesOptions = get(widget, 'props.view.options', []);
  const _columns = DisplayElementService.getModelAttributesLikeColumns(modelAttributes);
  const defaultPredicate = ParserPredicate.getDefaultPredicates(_columns);

  const predicate = get(widget, 'props.config.widgetDisplayCondition');
  const [_predicate, setPredicate] = useState(predicate || defaultPredicate);
  const [individualSettings, setIndividualSettings] = useState(get(widget, ['props', 'config', CONFIG_VERSION], {}));
  const [collapsed, setCollapsed] = useState(get(widget, 'props.config.collapsed'));
  const [formMode, setFormMode] = useState(get(widget, 'props.config.formMode', get(widget, 'props.view.default')));

  const onGoJournal = () => {
    DialogManager.hideAllDialogs();
    goToJournalsPage({
      journalId: SystemJournals.TYPES,
      journalsListId: SYSTEM_LIST
    });
  };
  const onApply = () => {
    const updWidget = cloneDeep(widget);

    if (!isEqual(predicate, _predicate) && !isEqual(_predicate, defaultPredicate)) {
      set(updWidget, 'props.config.widgetDisplayCondition', _predicate);
    }

    set(updWidget, ['props', 'config', CONFIG_VERSION], merge(get(updWidget, ['props', 'config', CONFIG_VERSION]), individualSettings));
    set(updWidget, 'props.config.version', CONFIG_VERSION);
    set(updWidget, 'props.config.collapsed', collapsed);
    set(updWidget, 'props.config.formMode', formMode);

    executors.edit(updWidget);
    hideModal();
  };

  let IndividualWidgetSettings = loadedWidgetSettings[widget.name];

  if (!IndividualWidgetSettings) {
    IndividualWidgetSettings = Components.settings(widget.name);
    loadedWidgetSettings[widget.name] = IndividualWidgetSettings;
  }

  useEffect(() => {
    return () => {
      loadedWidgetSettings = {};
    };
  }, []);

  return (
    <>
      <Checkbox
        className="w-100"
        checked={collapsed}
        onChange={({ checked }) => setCollapsed(checked)}
        title={t(Labels.COLLAPSED_BY_DEFAULT_INFO)}
      >
        {t(Labels.COLLAPSED_BY_DEFAULT_LABEL)}
      </Checkbox>
      <InfoText className="justify-content-start pl-0 pt-0" text={t(Labels.COLLAPSED_BY_DEFAULT_INFO)} />

      {widget.props && widget.props.view && (
        <div className="ecos-ds-widget-settings mb-3">
          <label className="ecos-dashboard-settings__container-subtitle w-100">
            {t(Labels.FORM_MODE_SELECT_LABEL)}
            <Select
              value={propertiesOptions.find(i => i.value === formMode)}
              options={propertiesOptions}
              getOptionLabel={option => t(option.label)}
              onChange={({ value }) => setFormMode(value)}
            />
          </label>
        </div>
      )}

      <div className="ecos-ds-widget-settings__title">
        {t(Labels.DISPLAY_CONDITION_TITLE)}
        <IcoBtn invert icon="icon-arrow" className="ecos-btn_narrow" onClick={onGoJournal}>
          {t(Labels.JOURNAL_TYPE_GOTO)}
        </IcoBtn>
      </div>
      {isEmpty(props.modelAttributes) && <InfoText noIndents text={t(Labels.DISPLAY_CONDITION_NO_ATTR)} />}
      {!isEmpty(props.modelAttributes) && (
        <Filters
          predicate={_predicate}
          columns={_columns}
          sourceId={SourcesId.TYPE}
          className="ecos-ds-widget-settings__filter"
          textEmpty={t(Labels.DISPLAY_CONDITION_NO_RULES)}
          onChange={setPredicate}
        />
      )}

      <Suspense fallback={<Loader type="points" />}>
        <div className="mt-3">
          <IndividualWidgetSettings widget={individualSettings} onChange={setIndividualSettings} />
        </div>
      </Suspense>

      <div className="ecos-ds-widget-settings__buttons">
        <Btn onClick={hideModal}>{t(Labels.MODAL_CANCEL)}</Btn>
        <Btn className="ecos-btn_blue" onClick={onApply}>
          {t(Labels.MODAL_APPLY)}
        </Btn>
      </div>
    </>
  );
};
