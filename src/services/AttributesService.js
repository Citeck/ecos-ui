import { notifyFailure } from '../components/Records/actions/util/actionUtils';

export default class AttributesService {
  static get hasContent() {
    return {
      hasContent: '.has(n:"cm:content")'
    };
  }

  static getPermissions(permissions) {
    const attributes = {};

    for (let i = 0; i < permissions.length; i++) {
      const permission = permissions[i];
      attributes[`hasPermission${permission}`] = `.att(n:"permissions"){has(n:"${permission}")}`;
    }

    return attributes;
  }

  static getGroupBy(groupBy, link) {
    const attributes = link || {};

    for (let att of groupBy) {
      attributes['groupBy_' + att] = att + '?str';
    }

    return attributes;
  }

  static parseId(idWithSource) {
    const [source, id] = idWithSource.split('@');

    if (!source) {
      console.error('no-source');
      notifyFailure('no-source');
      return;
    }

    return id;
  }
}
