import EN from '../en.json';
import RU from '../ru.json';

describe('Language Localisation', () => {
  const ruKeys = Object.keys(RU);
  const enKeys = Object.keys(EN);

  it(`Quantity of keys, expect ${ruKeys.length}`, () => {
    expect(ruKeys.length).toEqual(enKeys.length);
  });

  it(`Compliance of keys, comparing RU - EN`, () => {
    expect(ruKeys.sort()).toEqual(enKeys.sort());
  });

  it(`Checking EN values by cyrillic`, () => {
    const enValues = Object.values(EN);
    const incorrect = enValues.filter(item => /[А-Я]/gi.test(String(item)));

    expect(incorrect).toEqual([]);
  });

  // D-UI-LEXICAL-FLOAT-EN: the floating format toolbar showed «Format text as bold» / «Insert link»
  // in a Russian interface. The translations were already in both dictionaries under these keys —
  // they had simply never been wired into the markup — so a missing key is not what to guard here.
  // What has to hold is that the Russian value is a translation and not a copy of the English one,
  // which is the shape the defect would take if the keys were ever filled in mechanically.
  it(`Checking the Lexical toolbar labels are translated, not copied`, () => {
    const untranslated = Object.keys(EN).filter(
      key => (key.startsWith('lexical.plugins.float-text-format.') || key.startsWith('lexical.plugins.toolbar.')) && RU[key] === EN[key]
    );

    expect(untranslated).toEqual([]);
  });

  it(`Checking templates`, () => {
    const incorrect = [];

    for (const key in RU) {
      const ru = RU[key] && RU[key].includes('{{');
      const en = EN[key] && EN[key].includes('{{');

      if (ru !== en) {
        incorrect.push(key);
      }
    }

    expect(incorrect).toEqual([]);
  });
});
