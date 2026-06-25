const fs = require('fs');
const path = require('path');

// Regression for docs/plans/kaoto-catalog-prod-deploy.md:
// при `catalogUrl = '/camel-catalog/'` openresty в prod-сборке отдаёт 403 на запрос
// директории (нет `index index.json;`). Kaoto вычисляет basePath как
// catalogUrl.substring(0, lastIndexOf('/')) — поэтому `/camel-catalog/index.json`
// даёт идентичный basePath и фиксит первый fetch без правок proxy.
const KAOTO_MODELER_PATH = path.resolve(__dirname, '../KaotoModeler.jsx');

describe('KaotoModeler default catalogUrl', () => {
  test('points to index.json (not directory) so prod openresty returns 200', () => {
    const src = fs.readFileSync(KAOTO_MODELER_PATH, 'utf8');
    expect(src).toMatch(/catalogUrl\s*=\s*'\/camel-catalog\/index\.json'/);
    expect(src).not.toMatch(/catalogUrl\s*=\s*'\/camel-catalog\/'/);
  });
});
