import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { PREFIX_FIELD } from '../../../../../../constants/cmmn';
import { t } from '../../../../../../helpers/util';
import { BPMN_LINT_PREFIX } from '../constants';

const PARTICIPANT = 'bpmn:Participant';

const participantHasProcessId = {
  id: 'participant-has-process-id',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, PARTICIPANT)) {
        return;
      }

      const processRefAttr = `${PREFIX_FIELD}processRef`;
      const processRef = get(node.$attrs, [processRefAttr], '').trim();

      if (!processRef) {
        reporter.report(node.id, t('bpmn-linter.participant.no-process-id'));
      }
    };

    return {
      check
    };
  }
};

export const participantRulesMap = {
  [participantHasProcessId.id]: 'error'
};

export const participantCacheMap = {
  [`${BPMN_LINT_PREFIX}${participantHasProcessId.id}`]: participantHasProcessId.callback
};
