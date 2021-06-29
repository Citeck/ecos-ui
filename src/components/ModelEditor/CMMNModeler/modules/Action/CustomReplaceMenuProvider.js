import inherits from 'inherits';
import ReplaceMenuProvider from 'cmmn-js/lib/features/popup-menu/ReplaceMenuProvider';
import { isManualActivation, isRepeatable } from 'cmmn-js/lib/util/ModelUtil';

import { extractLabel } from '../../../../../helpers/util';
import * as CmmnUtils from '../../utils';
import actionTypes from './action-types.json';

/**
 * This module is an element agnostic replace menu provider for the popup menu.
 */
export default function CustomReplaceMenuProvider(popupMenu, cmmnReplace, cmmnFactory, modeling, rules, eventBus) {
  this._popupMenu = popupMenu;
  this._cmmnReplace = cmmnReplace;
  this._cmmnFactory = cmmnFactory;
  this._modeling = modeling;
  this._eventBus = eventBus;
  this._rules = rules;

  this.register();
}

inherits(CustomReplaceMenuProvider, ReplaceMenuProvider);

CustomReplaceMenuProvider.$inject = ['popupMenu', 'cmmnReplace', 'cmmnFactory', 'modeling', 'rules', 'eventBus'];

CustomReplaceMenuProvider.prototype.getEntries = function(element) {
  const eventBus = this._eventBus;
  const ecosType = CmmnUtils.getEcosType(element);

  if (!ecosType) {
    return ReplaceMenuProvider.prototype.getEntries.call(this, element);
  }

  return actionTypes.map(actionType => ({
    id: `action_${actionType.id}`,
    label: extractLabel(actionType.name),
    action: function() {
      element.businessObject.definitionRef.set('ecos:cmmnType', actionType.id);
      eventBus.fire('element.changed', { element });
    }
  }));
};

CustomReplaceMenuProvider.prototype.getHeaderEntries = function(element) {
  const self = this;
  const ecosType = CmmnUtils.getEcosType(element);

  if (!ecosType) {
    return ReplaceMenuProvider.prototype.getHeaderEntries.call(this, element);
  }

  function toggleControlEntry(control, type) {
    return function(event, entry) {
      const value = {};

      if (entry.active) {
        value[control] = undefined;
      } else {
        value[control] = self._cmmnFactory.create(type);
      }

      self._modeling.updateControls(element, value);
    };
  }

  const repeatable = isRepeatable(element);
  const manualActivation = isManualActivation(element);

  return [
    {
      id: 'toggle-manual-activation-rule',
      className: 'cmmn-icon-manual-activation-marker',
      title: 'Manual Activation Rule',
      active: manualActivation,
      action: toggleControlEntry('manualActivationRule', 'cmmn:ManualActivationRule')
    },
    {
      id: 'toggle-repetition-rule',
      className: 'cmmn-icon-repetition-marker',
      title: 'Repetition Rule',
      active: repeatable,
      action: toggleControlEntry('repetitionRule', 'cmmn:RepetitionRule')
    }
  ];
};

/**
 * Register replace menu provider in the popup menu
 */
CustomReplaceMenuProvider.prototype.register = function() {
  this._popupMenu.registerProvider('cmmn-replace', this);
};
