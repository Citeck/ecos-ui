import moment from 'moment';
import get from 'lodash/get';

import { t } from '../helpers/util';

export default class EsignConverter {
  static async getCertificateForModal(source = {}) {
    const target = {};

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    target.id = source.serialNumber;
    target.thumbprint = source.thumbprint;
    target.subject = await source.certApi.SubjectName;
    target.issuer = await source.certApi.IssuerName;
    target.issuer = await source.certApi.IssuerName;
    target.dateFrom = moment(get(source, 'validPeriod.from', new Date())).format('DD.MM.YYYY HH:mm:ss');
    target.dateTo = moment(get(source, 'validPeriod.to', new Date())).format('DD.MM.YYYY HH:mm:ss');
    target.provider = await source.privateKey.ProviderName;
    target.friendlySubjectInfo = source.friendlySubjectInfo();
    target.name = `${get(source.friendlySubjectInfo().find(item => item.code === 'CN'), 'text', target.subject)} ${t('от')} ${
      target.dateFrom
    }`;
    target.friendlyIssuerInfo = source.friendlyIssuerInfo();

    return target;
  }
}
