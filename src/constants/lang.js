export const LANGUAGE_RU = 'ru';
export const LANGUAGE_EN = 'en';
export const LANGUAGE_ES = 'es';
const IMG_V = '2';

export const allowedLanguages = [
  {
    id: LANGUAGE_EN,
    label: 'Eng',
    img: `${process.env.PUBLIC_URL}/img/language-flags/${LANGUAGE_EN}.png?v=${IMG_V}`
  },
  {
    id: LANGUAGE_ES,
    label: 'Esp',
    img: `${process.env.PUBLIC_URL}/img/language-flags/${LANGUAGE_ES}.png?v=${IMG_V}`
  }
];
