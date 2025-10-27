import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import { Labels } from './constants';

import { updateJournalWidgetsConfig } from '@/actions/journals';
import { WidgetsConfigType } from '@/components/Journals/JournalsPreviewWidgets/JournalsPreviewWidgets';
import { Btn } from '@/components/common/btns';
import { Field, MLText } from '@/components/common/form';
import { BaseWidgetProps } from '@/components/widgets/BaseWidget';
import { wrapArgs } from '@/helpers/store';
import { t } from '@/helpers/util';
import { selectWidgetsConfig } from '@/selectors/journals';
import { MLTextType } from '@/types/components';
import { Dispatch, RootState } from '@/types/store';
import './style.scss';

interface Props {
  id: string;
  stateId: string;
  onClose: () => void;
  isJournalMode: boolean;
  label?: MLTextType | string;
  updateJournalWidgetsConfig?: (config?: Partial<WidgetsConfigType>) => void;
  onSave?: BaseWidgetProps['onSave'];
  widgetsConfig?: Partial<WidgetsConfigType>;
  config?: BaseWidgetProps['config'] & { label: Props['label'] };
}

const SettingsWidget = ({
  updateJournalWidgetsConfig,
  widgetsConfig,
  onClose,
  label: pLabel,
  id,
  isJournalMode,
  onSave,
  config
}: Props) => {
  const [label, setLabel] = useState<MLTextType | null>(!isString(pLabel) ? pLabel || null : null);

  const saveWidgetsConfig = () => {
    if (isEmpty(label)) {
      return;
    }

    if (isJournalMode) {
      const { widgets } = widgetsConfig || {};

      if (isArray(widgets) && isArray(widgets[0])) {
        const newWidgets = widgets[0].map(widget => (widget && widget.id === id ? { ...widget, label } : widget));
        updateJournalWidgetsConfig && updateJournalWidgetsConfig({ widgets: [newWidgets] });
      }
      onClose();
    } else if (id && isFunction(onSave)) {
      onSave(id, { ...(config || {}), label }, onClose);
    }
  };

  return (
    <div className="ecos-hierarchical-tree-widget__editor">
      <div className="ecos-hierarchical-tree-widget__editor-content">
        <Field isRequired isSmall label={t(Labels.SETTINGS_LABEL)}>
          <MLText value={label} onChange={setLabel} />
        </Field>
      </div>
      <div className="ecos-hierarchical-tree-widget__editor-actions">
        <Btn onClick={onClose}>{t(Labels.BTN_CANCEL)}</Btn>
        <Btn className="ecos-btn_blue" onClick={saveWidgetsConfig}>
          {t(Labels.BTN_SAVE)}
        </Btn>
      </div>
    </div>
  );
};

const mapStateToProps = (
  state: RootState,
  props: Omit<Props, 'widgetsConfig' | 'updateJournalWidgetsConfig'>
): Pick<Props, 'widgetsConfig'> => ({
  //@ts-ignore
  widgetsConfig: selectWidgetsConfig(state, props.stateId)
});

const mapDispatchToProps = (
  dispatch: Dispatch,
  props: Omit<Props, 'updateJournalWidgetsConfig'>
): Pick<Props, 'updateJournalWidgetsConfig'> => {
  const w = wrapArgs(props.stateId);

  return {
    updateJournalWidgetsConfig: config => dispatch(updateJournalWidgetsConfig(w<Partial<WidgetsConfigType> | undefined>(config)))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsWidget);
