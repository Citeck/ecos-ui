const LANGUAGE_RU = 'ru';
const LANGUAGE_EN = 'en';
const IMG_V = '2';

export const defaultLanguages = [
  {
    id: LANGUAGE_EN,
    label: 'Eng',
    img: `${process.env.PUBLIC_URL}/img/language-flags/${LANGUAGE_EN}.png?v=${IMG_V}`
  },
  {
    id: LANGUAGE_RU,
    label: 'Рус',
    img: `${process.env.PUBLIC_URL}/img/language-flags/${LANGUAGE_RU}.png?v=${IMG_V}`
  }
];
