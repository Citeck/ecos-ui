import Records from '../components/Records/Records';

class LocaleServiceApi {
  async getServerMessage({ prefix = '', value = '', postfix = '' }) {
    return Records.get(`alfresco/i18n-value@${prefix}${value}${postfix}`)
      .load('.disp')
      .then(value => value)
      .catch(e => {
        console.error(e);
      });
  }
}

const INSTANCE = new LocaleServiceApi();

export default INSTANCE;
