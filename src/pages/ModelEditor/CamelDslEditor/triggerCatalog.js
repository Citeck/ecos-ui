/**
 * Available triggers (`from:`) when creating a route from scratch
 * (see docs/plans/kaoto-mvp-finalization.md §5).
 *
 * Each trigger:
 *   - key               — stable ID selected in the dropdown.
 *   - label             — what the user sees.
 *   - category          — group for visual separation in the dropdown.
 *   - defaultUri        — URI written into from.uri.
 *   - defaultParameters — object written into from.parameters (optional).
 */

import { STANDARD_EVENT_NAMES } from '@/components/editors/ModelEditor/KaotoModeler/ecosEvents';

const CATEGORY_CITECK = 'Citeck Events';
const CATEGORY_CAMEL_CORE = 'Camel core';

export const TRIGGER_CATEGORIES = [CATEGORY_CITECK, CATEGORY_CAMEL_CORE];

// Citeck Events — derived from the canonical event-name list (single source of truth, ecosEvents.js).
const CITECK_EVENT_TRIGGERS = STANDARD_EVENT_NAMES.map(name => ({
  key: `ecos-event-${name}`,
  label: `ecos-event: ${name}`,
  category: CATEGORY_CITECK,
  defaultUri: `ecos-event:${name}`,
  defaultParameters: { recordType: 'document' }
}));

export const TRIGGERS = [
  ...CITECK_EVENT_TRIGGERS,

  // === Camel core (3) ===
  {
    key: 'timer',
    label: 'timer (cron / scheduled)',
    category: CATEGORY_CAMEL_CORE,
    defaultUri: 'timer:tick',
    defaultParameters: { period: 60000 }
  },
  {
    key: 'direct',
    label: 'direct (invoke from another route)',
    category: CATEGORY_CAMEL_CORE,
    defaultUri: 'direct:entry',
    defaultParameters: null
  },
  {
    key: 'quartz',
    label: 'quartz (cron, advanced)',
    category: CATEGORY_CAMEL_CORE,
    defaultUri: 'quartz:trigger',
    defaultParameters: { cron: '0+0+12+*+*+?' }
  }
];

export function findTrigger(key) {
  return TRIGGERS.find(t => t.key === key) || null;
}
