import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { PREFIX_FIELD } from '../../../../../../constants/cmmn';
import { t } from '../../../../../../helpers/util';
import { BPMN_LINT_PREFIX } from '../constants';

const CALL_ACTIVITY = 'bpmn:CallActivity';

const callActivityHasProcessOrElement = {
  id: 'call-activity-has-process-or-element',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, CALL_ACTIVITY)) {
        return;
      }

      const processRefAttr = `${PREFIX_FIELD}processRef`;
      const calledElementAttr = `${PREFIX_FIELD}calledElement`;

      const processRef = get(node.$attrs, [processRefAttr], '').trim();
      const calledElement = get(node.$attrs, [calledElementAttr], '').trim();

      if (!processRef && !calledElement) {
        reporter.report(node.id, t('bpmn-linter.call-activity.no-process-and-element'));
      }
    };

    return {
      check
    };
  }
};

const callActivityHasConnection = {
  id: 'call-activity-has-connection',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, CALL_ACTIVITY)) {
        return;
      }

      const processBindingAttr = `${PREFIX_FIELD}processBinding`;

      const processBinding = get(node.$attrs, [processBindingAttr], '').trim();

      if (!processBinding) {
        reporter.report(node.id, t('bpmn-linter.call-activity.no-connection'));
      }
    };

    return {
      check
    };
  }
};

const callActivityHasVersionTag = {
  id: 'call-activity-has-version-tag',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, CALL_ACTIVITY)) {
        return;
      }

      const processBindingAttr = `${PREFIX_FIELD}processBinding`;
      const processVersionTagAttr = `${PREFIX_FIELD}processVersionTag`;

      const processBinding = get(node.$attrs, [processBindingAttr], '').trim();
      const processVersionTag = get(node.$attrs, [processVersionTagAttr], '').trim();

      if (processBinding === 'VERSION_TAG' && !processVersionTag) {
        reporter.report(node.id, t('bpmn-linter.call-activity.no-version-tag'));
      }
    };

    return {
      check
    };
  }
};

const callActivityHasVersion = {
  id: 'call-activity-has-version',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, CALL_ACTIVITY)) {
        return;
      }

      const processBindingAttr = `${PREFIX_FIELD}processBinding`;
      const processVersionAttr = `${PREFIX_FIELD}processVersion`;

      const processBinding = get(node.$attrs, [processBindingAttr], '').trim();
      const processVersion = get(node.$attrs, [processVersionAttr], '').trim();

      if (processBinding === 'VERSION' && !processVersion) {
        reporter.report(node.id, t('bpmn-linter.call-activity.no-version'));
      }
    };

    return {
      check
    };
  }
};

export const callActivityRulesMap = {
  [callActivityHasProcessOrElement.id]: 'error',
  [callActivityHasConnection.id]: 'error',
  [callActivityHasVersionTag.id]: 'error',
  [callActivityHasVersion.id]: 'error'
};

export const callActivityCacheMap = {
  [`${BPMN_LINT_PREFIX}${callActivityHasProcessOrElement.id}`]: callActivityHasProcessOrElement.callback,
  [`${BPMN_LINT_PREFIX}${callActivityHasConnection.id}`]: callActivityHasConnection.callback,
  [`${BPMN_LINT_PREFIX}${callActivityHasVersionTag.id}`]: callActivityHasVersionTag.callback,
  [`${BPMN_LINT_PREFIX}${callActivityHasVersion.id}`]: callActivityHasVersion.callback
};
