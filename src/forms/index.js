// import './Formio';
import './components';
import './Webform';
import './WebformBuilder';
import { i18nInit } from '../i18n';

i18nInit({ debug: process.env.NODE_ENV === 'development' }).then(() => {
  import('./Formio').then(Formio => Formio);
});
