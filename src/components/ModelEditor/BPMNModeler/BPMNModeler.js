import Modeler from 'bpmn-js/lib/Modeler';
import PaletteProvider from 'bpmn-js/lib/features/palette/PaletteProvider';
import ReplaceMenuProvider from 'bpmn-js/lib/features/popup-menu/ReplaceMenuProvider';
// import from "cmmn-js" because ModelingUtil.getParent from "bpmn-js" package returns null
import { getParent } from 'cmmn-js/lib/features/modeling/util/ModelingUtil';
import { getBusinessObject } from 'cmmn-js/lib/util/ModelUtil';

import BaseModeler from '../BaseModeler';
import customModules from './modules';
import './patches';

import ecosTask from './moddle/ecosTask.json';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { TASK_TYPES } from '../../../constants/bpmn';

const originGetPaletteEntries = PaletteProvider.prototype.getPaletteEntries;
const originCreateEntries = ReplaceMenuProvider.prototype._createEntries;
const originGetHeaderEntries = ReplaceMenuProvider.prototype.getHeaderEntries;

const disabledPaletteElements = [
  'create.group', // Create-a-group
  'create.participant-expanded', // Create pool/participant
  'create.data-store', // Data Store
  'create.data-object' // Data Store
];
const disabledReplaceMenuForTasks = [
  'replace-with-rule-task', // Business rule
  'replace-with-call-activity', // Call Activity
  'replace-with-manual-task', // Manual Task
  'replace-with-service-task', // Service task
  'replace-with-receive-task' // Receive task
];
const disabledReplaceMenuForEvents = [
  'replace-with-conditional-intermediate-catch', // Conditional Intermediate Catch Event
  'replace-with-none-intermediate-throw', // Intermediate Throw Event
  'replace-with-message-intermediate-catch', // Message Intermediate Catch Event
  'replace-with-escalation-intermediate-throw', // Escalation Intermediate Throw Event
  'replace-with-message-intermediate-throw', // Message Intermediate Throw Event
  'replace-with-signal-intermediate-throw', // Signal Intermediate Throw Event
  'replace-with-compensation-intermediate-throw', // Compensation Intermediate Throw Event
  'replace-with-link-intermediate-throw' // Link Intermediate Throw Event
];
const disabledHeaderEntries = {
  'bpmn:SubProcess': [
    'toggle-loop', // Loop
    'toggle-adhoc' // Ad-hoc
  ]
};

PaletteProvider.prototype.getPaletteEntries = function() {
  const entries = originGetPaletteEntries.apply(this);

  disabledPaletteElements.forEach(key => {
    delete entries[key];
  });

  return entries;
};

ReplaceMenuProvider.prototype._createEntries = function(element, replaceOptions) {
  if (TASK_TYPES.includes(element.type)) {
    replaceOptions = replaceOptions.filter(option => !disabledReplaceMenuForTasks.includes(option.actionName));
  }

  if (element.businessObject.eventDefinitions) {
    replaceOptions = replaceOptions.filter(option => !disabledReplaceMenuForEvents.includes(option.actionName));
  }

  return originCreateEntries.call(this, element, replaceOptions);
};

ReplaceMenuProvider.prototype.getHeaderEntries = function(element) {
  let entries = originGetHeaderEntries.call(this, element);

  if (Object.keys(disabledHeaderEntries).includes(element.type)) {
    entries = entries.filter(item => !disabledHeaderEntries[element.type].includes(item.id));
  }

  return entries;
};

export default class BPMNModeler extends BaseModeler {
  initModelerInstance = () => {
    this.modeler = new Modeler({
      additionalModules: [customModules],
      moddleExtensions: {
        ecosTask: ecosTask
      },
      keyboard: { bindTo: document }
    });
  };

  get elementDefinitions() {
    const searchProvider = this.modeler.get('bpmnSearch');
    const root = searchProvider._canvas.getRootElement();

    return getParent(getBusinessObject(root), 'bpmn:Definitions');
  }

  saveXML = ({ callback }) => {
    if (!this.modeler) {
      return;
    }

    this.modeler
      .saveXML({ format: true })
      .then(callback)
      .catch(callback);
  };

  saveSVG = ({ callback }) => {
    if (!this.modeler) {
      return;
    }

    this.modeler
      .saveSVG({ format: true })
      .then(callback)
      .catch(callback);
  };
}
