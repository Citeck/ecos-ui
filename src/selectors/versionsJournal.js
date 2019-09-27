import get from 'lodash/get';
import { t } from '../helpers/util';

export const selectLabelsVersions = (state, id, isMobile) =>
  get(state, ['versionsJournal', id, 'versions'], []).map(item => ({
    id: item.id,
    text: `${t('versions-journal-widget.version')} ${item.version}`,
    shortText: `v ${item.version}`
  }));
