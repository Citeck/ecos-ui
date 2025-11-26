import { is } from 'bpmn-js/lib/util/ModelUtil';
import get from 'lodash/get';

import { BPMN_LINT_PREFIX } from '../constants';

import { t } from '@/helpers/util';

const PARTICIPANT = 'bpmn:Participant';

const participantHasProcessId = {
  id: 'participant-has-process-id',
  callback: () => {
    const check = (node, reporter) => {
      if (!is(node, PARTICIPANT)) {
        return;
      }

      if (!get(node, 'processRef.id')) {
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
