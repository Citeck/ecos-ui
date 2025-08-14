////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NOTE Imports
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import {
  COMMON_FIELDS,
  ISSUER_FIELDS,
  SUBJECT_FIELDS
} from './constants/signFields';

/**
 * @description объект, в котором собираются данные о подписчике в подписи и методы по работе с этими данными
 */
class SignerAdjuster {
  constructor(data) {
    const {
      signersApi,
      certificate,
      issuerName,
      subjectName,
      signingTime,
      signatureIsValid,
    } = data;

    this.signersApi = signersApi;
    this.certificate = certificate;
    this.issuerName = issuerName;
    this.subjectName = subjectName;
    this.signingTime = signingTime;
    this.signatureIsValid = signatureIsValid;
  }

  parseSubject() {
    const subjectIssuerArr = this.subjectName.split(', ');
    const fields = {
      ...COMMON_FIELDS,
      ...SUBJECT_FIELDS,
    };
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

  parseIssuer() {
    const subjectIssuerArr = this.issuerName.split(', ');
    const fields = {
      ...COMMON_FIELDS,
      ...ISSUER_FIELDS,
    };
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
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NOTE Exports
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default SignerAdjuster;
