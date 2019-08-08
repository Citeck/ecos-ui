import moment from 'moment';

export default class VersionsJournalConverter {
  static getVersionForWeb(source = {}) {
    const target = {};
    let dateFormat = 'D MMMM, H:mm';

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    if (source.modified) {
      const dateInMoment = moment(source.modified);

      if (!dateInMoment.isSame(moment(), 'y')) {
        dateFormat = 'D MMMM YYYY, H:mm';
      }
    }

    target.firstName = source.firstName || '';
    target.lastName = source.lastName || '';
    target.middleName = source.middleName || '';
    target.userName = [source.firstName || '', source.middleName || '', source.lastName || ''].join(' ');
    target.comment = source.comment || '';
    target.version = source.version || '';
    target.date = source.modified
      ? moment(source.modified)
          .utc()
          .format(dateFormat)
      : '';
    target.name = source.name || '';
    target.id = source.id || '';
    target.url = source.downloadUrl || '';
    target.avatar = `/share/proxy/alfresco/citeck/ecos/image/thumbnail?nodeRef=${source.modifierId}&property=ecos:photo&width=50`;

    return target;
  }

  static getAdditionParamsForWeb(source = {}) {
    const target = {};

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    target.hasMore = source.hasMore || false;
    target.totalCount = source.totalCount || 0;

    return target;
  }
}
