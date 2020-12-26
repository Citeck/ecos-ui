import React from 'react';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { t } from '../../../helpers/export/util';
import { Icon, Tooltip } from '../../../components/common';
import { openWidgetSettings } from './WidgetSettings';

import '../style.scss';

const WidgetActions = props => {
  const { widget, executors } = props;
  const alertTooltip = getMessage(widget);
  const tooltipId = `widget-tooltip-${widget.id}`;

  return [
    alertTooltip && (
      <Tooltip
        className="ecos-ds-widget-actions__tooltip"
        target={tooltipId}
        text={alertTooltip}
        placement="top"
        trigger="hover"
        uncontrolled
        autohide
        key={`${widget.id}-alert`}
      >
        <Icon id={tooltipId} className="icon-alert ecos-ds-widget-actions__btn ecos-ds-widget-actions__btn_alert" />
      </Tooltip>
    ),
    <Icon
      className="icon-settings ecos-ds-widget-actions__btn ecos-ds-widget-actions__btn_edit"
      onClick={() => openWidgetSettings(props)}
      key={`${widget.id}-edit`}
    />,
    <Icon
      className="icon-small-close ecos-ds-widget-actions__btn ecos-ds-widget-actions__btn_remove"
      onClick={executors.remove}
      key={`${widget.id}-remove`}
    />
  ];
};

function getMessage(widget) {
  const hasSettings = !isEmpty(get(widget, 'props.config', {}));

  if (!hasSettings) {
    return null;
  }

  return t('dashboard-settings.widget.with-config');
}

export default WidgetActions;
