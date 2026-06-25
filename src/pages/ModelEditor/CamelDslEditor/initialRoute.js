import yaml from 'js-yaml';

import { findTrigger } from './triggerCatalog';

/**
 * Builds the initial YAML for a new route from the selected trigger.
 * See docs/plans/kaoto-mvp-finalization.md §5.
 *
 * Produces YAML like:
 *   - route:
 *       id: route-<8charSuffix>
 *       from:
 *         uri: <triggerUri>
 *         parameters: {...}
 *       steps: []
 */
export function buildInitialYaml(triggerKey) {
  const trigger = findTrigger(triggerKey);
  if (!trigger) {
    throw new Error(`Unknown trigger: ${triggerKey}`);
  }
  const routeId = 'route-' + Math.random().toString(36).slice(2, 10);
  const fromNode = { uri: trigger.defaultUri };
  if (trigger.defaultParameters) {
    fromNode.parameters = { ...trigger.defaultParameters };
  }
  fromNode.steps = [];
  const ast = [{ route: { id: routeId, from: fromNode } }];
  // noRefs: Camel YAML does not support anchors/aliases; lineWidth keeps long URIs on a single line.
  return yaml.dump(ast, { noRefs: true, lineWidth: 120 });
}
