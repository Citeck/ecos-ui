import fs from 'fs';
import path from 'path';

import React from 'react';
import { render } from '@testing-library/react';

const PKG_DIR = path.resolve(__dirname, '..');
const MODELER_PATH = path.join(PKG_DIR, 'KaotoModeler.jsx');

// Mock @kaoto/forms — SuggestionRegistryProvider is a pass-through wrapper, so child
// nodes mount synchronously and we can verify CiteckSuggestionsBootstrap was rendered.
jest.mock('@kaoto/forms', () => {
  const ReactLib = require('react');
  return {
    SuggestionRegistryProvider: jest.fn(props =>
      ReactLib.createElement('div', { 'data-testid': 'suggestion-registry-provider' }, props.children ?? null)
    )
  };
});

// Mock @monaco-editor/react — we don't render the YAML editor in the test (visual mode default).
jest.mock('@monaco-editor/react', () => {
  const ReactLib = require('react');
  return {
    __esModule: true,
    default: jest.fn(() => ReactLib.createElement('div', { 'data-testid': 'monaco-editor-stub' })),
    loader: { config: jest.fn() }
  };
});

// Mock RouteVisualizationWithCatalog so we don't drag in the entire @kaoto-internal stack.
jest.mock('../RouteVisualizationWithCatalog', () => {
  const ReactLib = require('react');
  return {
    __esModule: true,
    default: jest.fn(() => ReactLib.createElement('div', { 'data-testid': 'route-visualization-stub' }))
  };
});

// Mock CiteckSuggestionsBootstrap so we can assert it mounted and was placed inside the provider.
// Variable name MUST start with `mock` for jest.mock() factory hoisting (Jest convention).
const mockCiteckSuggestionsBootstrap = jest.fn(() =>
  require('react').createElement('div', { 'data-testid': 'citeck-suggestions-bootstrap' })
);
jest.mock('../CiteckSuggestionsBootstrap', () => ({
  __esModule: true,
  default: mockCiteckSuggestionsBootstrap
}));

const KaotoModeler = require('../KaotoModeler').default;

describe('Task 15: KaotoModeler mounts CiteckSuggestionsBootstrap inside SuggestionRegistryProvider', () => {
  beforeEach(() => {
    mockCiteckSuggestionsBootstrap.mockClear();
  });

  test('source imports CiteckSuggestionsBootstrap from co-located file', () => {
    const src = fs.readFileSync(MODELER_PATH, 'utf8');
    expect(src).toMatch(/import\s+CiteckSuggestionsBootstrap\s+from\s+'\.\/CiteckSuggestionsBootstrap'/);
  });

  test('source places <CiteckSuggestionsBootstrap /> as the first child of <SuggestionRegistryProvider>', () => {
    const src = fs.readFileSync(MODELER_PATH, 'utf8');
    // Capture the opening provider tag through the next non-whitespace child element.
    expect(src).toMatch(/<SuggestionRegistryProvider>\s*<CiteckSuggestionsBootstrap\s*\/>/);
  });

  test('renders without throwing and mounts CiteckSuggestionsBootstrap', () => {
    expect(() => render(React.createElement(KaotoModeler, { value: '' }))).not.toThrow();
    expect(mockCiteckSuggestionsBootstrap).toHaveBeenCalled();
  });

  test('mounts CiteckSuggestionsBootstrap inside the SuggestionRegistryProvider DOM subtree', () => {
    const { getByTestId } = render(React.createElement(KaotoModeler, { value: '' }));
    const provider = getByTestId('suggestion-registry-provider');
    const bootstrap = getByTestId('citeck-suggestions-bootstrap');
    expect(provider.contains(bootstrap)).toBe(true);
  });
});
