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
    target.tags = source.tags || [];
    target.editLink = source.editLink || '';

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

  // For an emodel record the api layer does not POST multipart form data — it uploads the raw
  // `file` through the chunked-upload module and mutates the record directly, so it needs the raw
  // fields (`record`/`file`/`comment`/`isMajor`), not just a FormData. `formData` is used only by
  // the legacy Alfresco branch (workspace://SpacesStore/ refs).
  static getAddVersionFormDataForServer(source = {}) {
    const target = {
      record: source.record,
      file: source.file,
      comment: source.comment,
      isMajor: !!source.isMajor
    };

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    const formData = new FormData();
    formData.append('filedata', source.file, source.file.name);
    formData.append('filename', source.file.name);
    formData.append('updateNodeRef', source.record);
    formData.append('description', source.comment);
    formData.append('majorversion', source.isMajor);
    formData.append('overwrite', 'true');

    target.formData = formData;

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
