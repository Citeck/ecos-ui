import _ from 'lodash';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';
import { append as svgAppend, attr as svgAttr, create as svgCreate, classes as svgClasses } from 'tiny-svg';
import { is } from 'bpmn-js/lib/util/ModelUtil';

import NumberRenderer from './EcosNumberRenderer';
import { getSearchParams } from '../../../../../helpers/urls';
import Records from '../../../../Records';
import { SourcesId } from '../../../../../constants';
import DurationFormatter from '../../../../Journals/service/formatters/registry/DurationFormatter/DurationFormatter';
import { TYPE_BPMN_TASK } from '../../../../../constants/bpmn';

const HIGH_PRIORITY = 1700;

class KPIRenderer extends NumberRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element) {
    if (document && document.getElementsByClassName('ecos-process-statistics-model-kpi')[0]) {
      return isAny(element, ['bpmn:Task', 'bpmn:Event', 'bpmn:CallActivity']) && !element.labelTarget;
    }

    return false;
  }

  drawShape(parentNode, element) {
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
        const percentTransform = is(element, TYPE_BPMN_TASK) ? [70, 85] : [0, -50];

        const timerRect = this.drawRect(parentNode, 75, 20, 8, '#000');
        const percentRect = this.drawRect(parentNode, 45, 20, 8, '#000');

        svgAttr(timerRect, {
          transform: 'translate(-10, 85)'
        });
        svgAttr(percentRect, {
          transform: `translate(${percentTransform[0]}, ${percentTransform[1]})`
        });

        this._drawKPITimer(
          parentNode,
          durationFormatterInstance.format({
            cell: KPI.kpi,
            config: { showSeconds: false }
          })
        );

        const percent = parseInt(KPI.kpiDeviation);
        this._drawKPIPercentage(parentNode, percent > 0 ? `+${percent}%` : `${percent}%`, [
          percentTransform[0] + 2,
          percentTransform[1] + 15
        ]);
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
