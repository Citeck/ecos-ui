import { AllowedLanguageType } from '@/types/langs';

export const LANGUAGE_RU = 'ru';
export const LANGUAGE_EN = 'en';

const IMG_V = '2';

export const allowedLanguages: AllowedLanguageType[] = [
  {
    id: LANGUAGE_EN,
    label: 'Eng',
    img: `${import.meta.env.BASE_URL}img/language-flags/${LANGUAGE_EN}.png?v=${IMG_V}`
  },
  {
    id: LANGUAGE_RU,
    label: 'Рус',
    img: `${import.meta.env.BASE_URL}img/language-flags/${LANGUAGE_RU}.png?v=${IMG_V}`
  }
];
