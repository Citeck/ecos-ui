import moment from 'moment';
import get from 'lodash/get';

import { t } from '../helpers/util';

export default class EsignConverter {
  static async getCertificateForModal(source = {}) {
    const target = {};

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    const subjectInfo = source.friendlySubjectInfo();
    const issuerInfo = source.friendlyIssuerInfo();
    const subjectCN = subjectInfo.find(item => item.code === 'CN');
    const issuerCN = issuerInfo.find(item => item.code === 'CN');

    target.id = source.serialNumber;
    target.thumbprint = source.thumbprint;
    target.subject = get(subjectCN, 'text', '');
    target.issuer = get(issuerCN, 'text', '');
    target.dateFrom = moment(get(source, 'validPeriod.from', new Date())).format('DD.MM.YYYY HH:mm:ss');
    target.dateTo = moment(get(source, 'validPeriod.to', new Date())).format('DD.MM.YYYY HH:mm:ss');
    target.provider = await source.privateKey.ProviderName;
    target.name = `${get(subjectCN, 'text', '')} ${t('от')} ${target.dateFrom}`;
    target.friendlySubjectInfo = source.friendlySubjectInfo();
    target.friendlyIssuerInfo = source.friendlyIssuerInfo();

    return target;
  }

  static getSignQueryParams(source = {}) {
    const target = {};

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    const { document, signedMessage, user, isApprovementSignature, thumbprint } = source;

    if (document) {
      target.nodeRef = document;
    }

    if (signedMessage) {
      target.sign = signedMessage;
    }

    if (user) {
      target.signer = user;
    }

    if (isApprovementSignature === true) {
      target.isApprovementSignature = true;
    }

    if (thumbprint) {
      target.thumbprint = thumbprint;
    }

    return target;
  }
}
