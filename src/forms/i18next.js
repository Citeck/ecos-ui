import i18next from 'i18next';

i18next.init({
  lng: 'en', // if you're using a language detector, do not define the lng option
  debug: true,
  resources: {
    en: {
      translation: {
        label: 'Label'
      }
    },
    ru: {
      translation: {
        label: 'Название поля'
      }
    }
  }
});

console.log('I18NEXT', i18next);

export default i18next;
