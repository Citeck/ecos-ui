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
