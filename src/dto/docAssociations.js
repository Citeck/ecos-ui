import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import moment from 'moment';

export function getDocumentsForWeb(source) {
  const target = {
    associatedWithDocs: [],
    baseDocs: [],
    accountingDocs: []
  };

  if (isEmpty(source)) {
    return target;
  }

  target.associatedWithDocs = get(source, ['associatedWith'], []).map(getDocumentForWeb);
  target.baseDocs = get(source, ['documents'], []).map(getDocumentForWeb);
  target.accountingDocs = get(source, ['accounting'], []).map(getDocumentForWeb);

  return target;
}

export function getDocumentForWeb(source) {
  if (isEmpty(source)) {
    return {};
  }

  const target = {};

  target.name = source.displayName;
  target.date = moment(source.created || moment()).format('DD.MM.YYYY h:mm');
  target.record = source.id;

  return target;
}
