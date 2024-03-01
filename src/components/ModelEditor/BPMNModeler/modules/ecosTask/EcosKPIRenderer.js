import _ from 'lodash';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';
import { append as svgAppend, attr as svgAttr, create as svgCreate, classes as svgClasses } from 'tiny-svg';

import NumberRenderer from './EcosNumberRenderer';
import { getSearchParams } from '../../../../../helpers/urls';
import Records from '../../../../Records';
import { SourcesId } from '../../../../../constants';
import DurationFormatter from '../../../../Journals/service/formatters/registry/DurationFormatter/DurationFormatter';

const HIGH_PRIORITY = 1700;

class KPIRenderer extends NumberRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element) {
    return isAny(element, ['bpmn:Task', 'bpmn:Event', 'bpmn:CallActivity']) && !element.labelTarget;
  }

  async drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);
    const activityId = _.get(element, 'id');
    const { recordRef } = getSearchParams();

    Records.query(
      {
        sourceId: SourcesId.BPMN_KPI,
        language: 'predicate',
        query: {
          t: 'and',
          val: [
            {
              t: 'eq',
              att: '_type',
              val: 'emodel/type@bpmn-kpi-value'
            },
            {
              att: 'procDefRef',
              t: 'contains',
              val: [recordRef]
            }
          ]
        },
        groupBy: ['kpiSettingsRef.kpiAsNumber&targetBpmnActivityId&kpiSettingsRef']
      },
      {
        kpiRef: 'kpiSettingsRef{disp:?disp,value:?assoc}',
        kpi: 'kpiSettingsRef.kpiAsNumber?num|fmt(0.00)',
        displayKpiOnBpmnActivityId: 'kpiSettingsRef.displayKpiOnBpmnActivityId',
        kpiValue: 'avg(value)?num|fmt(0.00)',
        kpiDeviation: '(avg(value) / kpiSettingsRef.kpiAsNumber * 100 - 100)?num|fmt(0.00)'
      }
    ).then(({ records = [] }) => {
      const durationFormatterInstance = new DurationFormatter();

      const KPI = records.find(i => i.displayKpiOnBpmnActivityId === activityId);

      if (KPI) {
        console.log(KPI);
        const timerRect = this.drawRect(parentNode, 75, 20, 8, '#000');
        const percentRect = this.drawRect(parentNode, 45, 20, 8, '#000');

        svgAttr(timerRect, {
          transform: 'translate(-10, 85)'
        });
        svgAttr(percentRect, {
          transform: 'translate(70, 85)'
        });

        this._drawKPITimer(
          parentNode,
          durationFormatterInstance.format({
            cell: KPI.kpi,
            config: { showSeconds: false }
          })
        );

        const percent = parseInt(KPI.kpiDeviation);
        this._drawKPIPercentage(parentNode, percent > 0 ? `+${percent}%` : `${percent}%`);
      }
    });

    return shape;
  }

  _drawKPITimer(parentNode, value) {
    const text = svgCreate('text');

    svgAttr(text, {
      fill: '#000',
      transform: 'translate(-5, 100)'
    });

    svgClasses(text).add('djs-label');
    svgAppend(text, document.createTextNode(value));
    svgAppend(parentNode, text);
  }

  _drawKPIPercentage(parentNode, value) {
    const text = svgCreate('text');

    svgAttr(text, {
      fill: '#000',
      transform: 'translate(75, 100)'
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
