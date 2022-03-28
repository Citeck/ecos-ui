import moment from 'moment';

import UserService from '../services/UserService';

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
    target.date = source.modified ? moment(source.modified).format(dateFormat) : '';
    target.name = source.name || '';
    target.id = source.id || '';
    target.url = source.downloadUrl || '';
    target.avatar = UserService.getAvatarUrl(source.avatarUrl, { width: 50 });

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

  static getAddVersionFormDataForServer(source = {}) {
    const target = new FormData();

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    target.append('filedata', source.file, source.file.name);
    target.append('filename', source.file.name);
    target.append('updateNodeRef', source.record);
    target.append('description', source.comment);
    target.append('majorversion', source.isMajor);
    target.append('overwrite', 'true');

    return target;
  }

  static getActiveVersionForServer(source = {}) {
    const target = {};

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    target.id = source.versionId || '';
    target.comment = source.comment || '';
    target.version = source.version || 1;
    target.majorVersion = source.isMajor || false;

    return target;
  }

  static getVersionsComparisonForServer(source = {}) {
    const target = {};

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    target.first = source.comparisonFirstVersion;
    target.second = source.comparisonSecondVersion;

    return target;
  }
}
