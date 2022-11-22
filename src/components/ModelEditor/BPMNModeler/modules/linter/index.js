import Linter from 'bpmn-js-bpmnlint';

import { t } from '../../../../../helpers/export/util';
import config from './bpmnlint-config';

import 'bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css';
import './style.scss';

const translations = {
  '{errors} Errors, {warnings} Warnings': 'bpmn-linter.all-errors',
  'Element is not connected': 'bpmn-linter.element.not-connected',
  'Sequence flow is missing condition': 'bpmn-linter.sequence-flow.missing-condition',
  'Process is missing end event': 'bpmn-linter.process.missing-end-event',
  'Sub process is missing end event': 'bpmn-linter.subprocess.missing-end-event',
  'Start event is missing event definition': 'bpmn-linter.start-event.missing-event-definition',
  'Incoming flows do not join': 'bpmn-linter.incoming-flow.join',
  'Element is missing bpmndi': 'bpmn-linter.bpmndi.missing',
  'Element has disallowed type {type}': 'bpmn-linter.bpmndi.missing',
  'SequenceFlow is a duplicate': 'bpmn-linter.sequence-flow.duplicate',
  'Duplicate incoming sequence flows': 'bpmn-linter.sequence-flow.incoming-duplicate',
  'Duplicate outgoing sequence flows': 'bpmn-linter.sequence-flow.outgoing-duplicate',
  'Gateway forks and joins': 'bpmn-linter.gateway.forks-and-joins',
  'Flow splits implicitly': 'bpmn-linter.flow.splits-implicitly',
  'Process has multiple blank start events': 'bpmn-linter.process.multiple-blank-start',
  'Sub process has multiple blank start events': 'bpmn-linter.subprocess.multiple-blank-start',
  'Event has multiple event definitions': 'bpmn-linter.event.multiple-definitions',
  'Process is missing start event': 'bpmn-linter.process.missing-start-event',
  'Sub process is missing start event': 'bpmn-linter.subprocess.missing-start-event',
  'Start event must be blank': 'bpmn-linter.event.start-blank',
  'Gateway is superfluous. It only has one source and target': 'bpmn-linter.gateway.superfluous',
  'Rule error: no check implemented': 'bpmn-linter.rule.no-check',
  'Rule error: enter is not a function': 'bpmn-linter.rule.no-func',
  'Toggle linting': 'bpmn-linter.toggle'
};

export const linting = {
  bpmnlint: config,
  active: true,
  disableToggleButton: true
};

const Linting = Linter.linting[1];
const originCreateButton = Linting.prototype._createButton;
const originUpdateButton = Linting.prototype._updateButton;
const originSetButtonState = Linting.prototype._setButtonState;

Linting.prototype._createButton = function() {
  if (linting.disableToggleButton) {
    return;
  }

  originCreateButton.call(this);
};

Linting.prototype._updateButton = function() {
  if (linting.disableToggleButton) {
    return;
  }

  originUpdateButton.call(this);
};

Linting.prototype._setButtonState = function() {
  if (linting.disableToggleButton) {
    return;
  }

  originSetButtonState.call(this);
};

Linting.prototype.getLintResult = function() {
  let errors = 0;
  let warnings = 0;

  Object.keys(this._issues).forEach(key => {
    this._issues[key].forEach(issue => {
      if (issue.category === 'error') {
        errors++;
      }

      if (issue.category === 'warn') {
        warnings++;
      }
    });
  });

  return { errors, warnings };
};

Linter.translate = ['value', (template, replacements = {}) => t(translations[template] || template, replacements)];

export default Linter;
