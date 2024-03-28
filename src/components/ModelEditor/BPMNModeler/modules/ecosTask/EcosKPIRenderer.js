import _ from 'lodash';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';
import { append as svgAppend, attr as svgAttr, create as svgCreate, classes as svgClasses } from 'tiny-svg';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { isExpanded } from 'bpmn-js/lib/util/DiUtil';

import NumberRenderer from './EcosNumberRenderer';
import { URL } from '../../../../../constants';
import DurationFormatter from '../../../../Journals/service/formatters/registry/DurationFormatter/DurationFormatter';
import { PERMISSION_VIEW_REPORTS, TYPE_BPMN_EVENT } from '../../../../../constants/bpmn';
import { getSearchParams } from '../../../../../helpers/urls';
import Records from '../../../../Records';

const HIGH_PRIORITY = 1700;

class KPIRenderer extends NumberRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
  }

  _isEditor() {
    if (window && window.location.pathname === URL.BPMN_EDITOR) {
      return true;
    }

    return false;
  }

  _isKPIModeDashlet() {
    return !_.isEmpty(document.getElementsByClassName('ecos-process-statistics-model-kpi'));
  }

  canRender(element) {
    if (!this._isEditor() && this._isKPIModeDashlet()) {
      if (isAny(element, ['bpmn:SubProcess']) && !element.labelTarget && !isExpanded(element)) {
        return true;
      }

      return isAny(element, ['bpmn:Task', 'bpmn:Event', 'bpmn:CallActivity']) && !element.labelTarget;
    }

    return false;
  }

  async drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);
    const activityId = _.get(element, 'id');
    const { recordRef } = getSearchParams();

    const isAccessible = await Records.get(recordRef).load(PERMISSION_VIEW_REPORTS);
    const { KPIData = [] } = window.Citeck;
    const KPI = KPIData.find(i => i.displayKpiOnBpmnActivityId === activityId);

    if (KPI && isAccessible) {
      const durationFormatterInstance = new DurationFormatter();
      const timerTransform = !is(element, TYPE_BPMN_EVENT) ? [-10, 85] : [-10, 65];
      const percentTransform = !is(element, TYPE_BPMN_EVENT) ? [70, 85] : [0, -45];

      const timerRect = this.drawRect(parentNode, 75, 20, 8, '#000');
      const percentRect = this.drawRect(parentNode, 45, 20, 8, '#000');

      svgAttr(timerRect, {
        transform: `translate(${timerTransform[0]}, ${timerTransform[1]})`
      });
      svgAttr(percentRect, {
        transform: `translate(${percentTransform[0]}, ${percentTransform[1]})`
      });

      this._drawKPITimer(
        parentNode,
        durationFormatterInstance.format({
          cell: KPI.kpi,
          config: { showSeconds: false }
        }),
        [timerTransform[0] + 2, timerTransform[1] + 15]
      );

      const percent = Math.round(KPI.kpiDeviation);
      this._drawKPIPercentage(parentNode, percent > 0 ? `+${percent}%` : `${percent}%`, [
        percentTransform[0] + 2,
        percentTransform[1] + 15
      ]);
    }

    return shape;
  }

  _drawKPITimer(parentNode, value, transform) {
    const text = svgCreate('text');

    svgAttr(text, {
      fill: '#000',
      transform: `translate(${transform[0]}, ${transform[1]})`
    });

    svgClasses(text).add('djs-label');
    svgAppend(text, document.createTextNode(value));
    svgAppend(parentNode, text);
  }

  _drawKPIPercentage(parentNode, value, transform) {
    const text = svgCreate('text');

    svgAttr(text, {
      fill: '#000',
      transform: `translate(${transform[0]}, ${transform[1]})`
    });

    svgClasses(text).add('djs-label');
    svgAppend(text, document.createTextNode(value));
    svgAppend(parentNode, text);
  }

  drawRect(parentNode, width, height, borderRadius, strokeColor) {
    const rect = svgCreate('rect');

    svgAttr(rect, {
      width,
      height,
      rx: borderRadius,
      ry: borderRadius,
      stroke: strokeColor || '#000',
      strokeWidth: 2,
      fill: '#fff'
    });

    svgAppend(parentNode, rect);

    return rect;
  }
}

KPIRenderer.$inject = ['eventBus', 'bpmnRenderer'];

export default KPIRenderer;
