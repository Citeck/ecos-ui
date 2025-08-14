import {
  COMMON_FIELDS,
  ISSUER_FIELDS,
  SUBJECT_FIELDS
} from './constants/signFields';

/**
 * @description объект, в котором собираются данные о сертификате и методы по работе с этими данными
 */
class CertificateAdjuster {
  constructor(data) {
    const {
      certApi,
      issuerInfo,
      privateKey,
      serialNumber,
      thumbprint,
      subjectInfo,
      validPeriod
    } = data;

    this.certApi = certApi;
    this.issuerInfo = issuerInfo;
    this.privateKey = privateKey;
    this.serialNumber = serialNumber;
    this.thumbprint = thumbprint;
    this.subjectInfo = subjectInfo;
    this.validPeriod = validPeriod;
  }

  /**
   * @method friendlyInfo
   * @param {String} subjectIssuer раздел информации 'issuerInfo' или 'subjectInfo'
   * @returns {Object}
   * @throws {Error}
   * @description возврящает объект из сформированных значений
   */
  friendlyInfo(subjectIssuer) {
    if (!this[subjectIssuer]) {
      throw new Error('Не верно указан аттрибут');
    }

    const subjectIssuerArr = this[subjectIssuer].split(', ');

    let fields = {};

    switch (subjectIssuer) {
      case 'subjectInfo':
        fields = {
          ...COMMON_FIELDS,
          ...SUBJECT_FIELDS,
        };
      case 'issuerInfo':
        fields = {
          ...COMMON_FIELDS,
          ...ISSUER_FIELDS,
        };
        break
    }

    const formedSubjectIssuerInfo = subjectIssuerArr.map(tag => {
      const tagArr = tag.split('=');
      const index = `${tagArr[0]}=`;

      return {
        code: tagArr[0],
        text: tagArr[1],
        value: fields[index] ? fields[index] : '',
      };
    });

    return formedSubjectIssuerInfo;
  }

  /**
   * @method friendlySubjectInfo
   * @returns {Array}
   * @description возвращает распаршенную информацию о строке subjectInfo
   */
  friendlySubjectInfo() {
    return this.friendlyInfo('subjectInfo');
  }

  /**
   * @method friendlyIssuerInfo
   * @returns {Array}
   * @description возвращает распаршенную информацию о строке issuerInfo
   */
  friendlyIssuerInfo() {
    return this.friendlyInfo('issuerInfo');
  }

  /**
   * @method friendlyValidPeriod
   * @returns {Object}
   * @description возвращает распаршенную информацию об объекте validPeriod
   */
  friendlyValidPeriod() {
    const {
      from,
      to
    } = this.validPeriod;

    return {
      from: this.friendlyDate(from),
      to: this.friendlyDate(to),
    };
  }

  /**
   * @function friendlyDate
   * @param {String} date строка с датой
   * @returns {Object}
   * @description формирует дату от переданного параметра
   * @todo padStart 2
   */
  friendlyDate(date) {
    const newDate = new Date(date);
    const [day, month, year] = [newDate.getDate(), newDate.getMonth() + 1, newDate.getFullYear()];
    const [hours, minutes, seconds] = [newDate.getHours(), newDate.getMinutes(), newDate.getSeconds()];

    return {
      ddmmyy: `${day}/${month}/${year}`,
      hhmmss: `${hours}:${minutes}:${seconds}`,
    };
  }

  /**
   * @async
   * @method isValid
   * @returns {Boolean} возвращает валидность сертификата
   * @throws {Error} возвращает сообщение об ошибке
   * @description прозиводит проверку на валидность сертификата
   */
  async isValid() {
    try {
      const isValid = await this.certApi.IsValid();

      return await isValid.Result;
    } catch (error) {
      throw new Error(`Произошла ошибка при проверке валидности сертификата: ${error.message}`);
    }
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NOTE Exports
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default CertificateAdjuster;
