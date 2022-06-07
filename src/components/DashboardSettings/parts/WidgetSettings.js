import React, { Suspense, useState, useEffect } from 'react';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';

import { SourcesId, SYSTEM_LIST, SystemJournals } from '../../../constants';
import { goToJournalsPage } from '../../../helpers/urls';
import { t } from '../../../helpers/export/util';
import DisplayElementService from '../../../services/DisplayElementService';
import { DialogManager } from '../../../components/common/dialogs';
import { Btn, IcoBtn } from '../../../components/common/btns';
import { InfoText, Loader } from '../../../components/common';
import { ParserPredicate } from '../../../components/Filters/predicates';
import Filters from '../../../components/Filters/Filters';
import Components from '../../widgets/Components';

const Labels = {
  MODAL_TITLE: 'widget-settings.title',
  MODAL_CANCEL: 'btn.cancel.label',
  MODAL_APPLY: 'btn.apply.label',
  JOURNAL_TYPE_GOTO: 'widget-settings.go-journal-types',
  DISPLAY_CONDITION_TITLE: 'widget-settings.display-condition',
  DISPLAY_CONDITION_NO_ATTR: 'widget-settings.dc-no-attributes',
  DISPLAY_CONDITION_NO_RULES: 'widget-settings.dc-no-rules'
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
  const predicate = get(widget, 'props.config.widgetDisplayCondition');
  const _columns = DisplayElementService.getModelAttributesLikeColumns(modelAttributes);
  const [_predicate, setPredicate] = useState(predicate || ParserPredicate.getDefaultPredicates(_columns));
  const [individualSettings, setIndividualSettings] = useState({});
  const onGoJournal = () => {
    DialogManager.hideAllDialogs();
    goToJournalsPage({
      journalId: SystemJournals.TYPES,
      journalsListId: SYSTEM_LIST
    });
  };
  const onApply = () => {
    const updWidget = cloneDeep(widget);

    if (!isEqual(predicate, _predicate)) {
      set(updWidget, 'props.config.widgetDisplayCondition', _predicate);
    }

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
        {/*todo: добавить обработчик изменения конфигурации*/}
        <IndividualWidgetSettings widget={widget} onChange={setIndividualSettings} />
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
