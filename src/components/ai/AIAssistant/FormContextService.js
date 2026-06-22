import get from 'lodash/get';
import pick from 'lodash/pick';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';

import { getTextByLocale } from '@/helpers/util';

/**
 * Form Context Service
 * Extracts and prepares form context data for AI operations
 *
 * Used to extract parent form data when working with nested forms (e.g., computed attributes modal)
 * The extracted data is sanitized and can be configured per context type
 */

/**
 * Field patterns to exclude (security-sensitive)
 */
const EXCLUDE_PATTERNS = [/password/i, /token/i, /secret/i, /key$/i, /credential/i, /_internal$/i];

/**
 * Default configuration for context extraction
 */
const DEFAULT_CONFIG = {
  enabled: true,
  strategy: 'all'
};

/**
 * Extraction configurations for different script context types
 */
const CONTEXT_CONFIGS = {
  computed_attribute: {
    enabled: true,
    strategy: 'all'
  },
  computed_role: {
    enabled: true,
    strategy: 'all'
  },
  ui_action: {
    enabled: true,
    strategy: 'whitelist',
    fields: ['_type', 'id', 'name', 'status']
  },
  journal_formatter: {
    enabled: true,
    strategy: 'blacklist',
    blacklistFields: ['_permissions', '_internal']
  },
  bpmn_script_task: {
    enabled: false
  },
  gateway_condition: {
    enabled: false
  },
  dev_console: {
    enabled: false
  }
};

export default class FormContextService {
  /**
   * Extract context data from form instance based on configuration
   * @param {Object} formInstance - FormIO component instance
   * @param {string} contextType - Script context type (e.g., 'computed_attribute')
   * @param {Object} config - Optional extraction configuration override
   * @returns {Object} Extracted and sanitized context data
   */
  static extractContextData(formInstance, contextType, config = null) {
    if (!formInstance) {
      return {};
    }

    const extractionConfig = config || this.getExtractionConfig(contextType);

    if (!extractionConfig.enabled) {
      return {};
    }

    const parentFormData = this.extractParentFormData(formInstance);

    if (!parentFormData || typeof parentFormData !== 'object' || isEmpty(parentFormData)) {
      return {};
    }

    const extractedData = this.applyExtractionConfig(parentFormData, extractionConfig);
    return this.sanitizeForAI(extractedData);
  }

  /**
   * Extract parent form data from FormIO instance hierarchy
   * @param {Object} formInstance - FormIO component instance
   * @returns {Object} Parent form data or empty object
   */
  static extractParentFormData(formInstance) {
    return get(formInstance, 'root.parentForm.data', {});
  }

  /**
   * Apply extraction configuration to filter/transform data
   * @param {Object} data - Raw form data
   * @param {Object} config - Extraction configuration
   * @returns {Object} Filtered data
   */
  static applyExtractionConfig(data, config = {}) {
    if (!data || typeof data !== 'object' || isEmpty(data)) {
      return {};
    }

    const { strategy = 'all', fields = [], blacklistFields = [], transform } = config;

    let result = data;

    if (strategy === 'whitelist' && fields.length > 0) {
      result = pick(data, fields);
    } else if (strategy === 'blacklist' && blacklistFields.length > 0) {
      result = omit(data, blacklistFields);
    }

    if (typeof transform === 'function') {
      result = transform(result);
    }

    return result;
  }

  /**
   * Sanitize data for AI context
   * Removes sensitive fields and converts to JSON-safe format
   * Handles circular references and arrays
   * @param {Object} data - Data to sanitize
   * @param {Set} visited - Set of visited objects for circular reference detection
   * @returns {Object} Sanitized data
   */
  static sanitizeForAI(data, visited = new Set()) {
    if (!data || typeof data !== 'object' || isEmpty(data)) {
      return {};
    }

    // Prevent circular references
    if (visited.has(data)) {
      return {};
    }
    visited.add(data);

    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      if (EXCLUDE_PATTERNS.some(pattern => pattern.test(key))) {
        continue;
      }

      if (typeof value === 'function' || typeof value === 'symbol') {
        continue;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        const sanitizedArray = value
          .filter(item => typeof item !== 'function' && typeof item !== 'symbol')
          .map(item => {
            if (item && typeof item === 'object') {
              return this.sanitizeForAI(item, visited);
            }
            return item;
          })
          .filter(item => item !== null && item !== undefined && !isEmpty(item));

        if (sanitizedArray.length > 0) {
          sanitized[key] = sanitizedArray;
        }
        continue;
      }

      // Handle nested objects
      if (value && typeof value === 'object') {
        const nested = this.sanitizeForAI(value, visited);
        if (!isEmpty(nested)) {
          sanitized[key] = nested;
        }
        continue;
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  /**
   * Get extraction configuration for a script context type
   * @param {string} contextType - Script context type
   * @returns {Object} Extraction configuration
   */
  static getExtractionConfig(contextType) {
    return CONTEXT_CONFIGS[contextType] || DEFAULT_CONFIG;
  }

  /**
   * Check if form context extraction is enabled for a context type
   * @param {string} contextType - Script context type
   * @returns {boolean} True if extraction is enabled
   */
  static isExtractionEnabled(contextType) {
    const config = this.getExtractionConfig(contextType);
    return config.enabled === true;
  }

  /**
   * Extract field context passed through form options
   * Used for computed attributes, script editing modals, etc.
   *
   *
   * @param {Object} formInstance - FormIO component instance
   * @returns {Object|null} Field context { id, name, type } or null if not available
   */
  static extractFieldContext(formInstance) {
    const fieldContext = get(formInstance, 'root.options.fieldContext');
    if (!fieldContext || !fieldContext.id) {
      return null;
    }

    return {
      id: fieldContext.id,
      name: getTextByLocale(fieldContext.name),
      type: fieldContext.type || 'TEXT'
    };
  }
}
