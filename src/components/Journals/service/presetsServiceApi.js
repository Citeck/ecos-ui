import Records from '../../Records/Records';
import { SourcesId } from '../../../constants';
import { PERMISSION_WRITE_ATTR } from '../../Records/constants';

class ID {
  static includes(id = '') {
    return id.includes(SourcesId.PRESETS);
  }

  static getFull(id = '') {
    return ID.includes(id) ? id : `${SourcesId.PRESETS}@${id}`;
  }

  static empty(id = '') {
    return id.split('@').length < 2;
  }
}

class PresetsServiceApi {
  async getJournalPresets({ journalId }) {
    return Records.query(
      {
        sourceId: SourcesId.PRESETS,
        query: { journalId }
      },
      {
        authority: 'authority',
        authorities: 'authorities[]',
        journalId: 'journalId',
        displayName: '?disp',
        settings: 'settings?json',
        editable: PERMISSION_WRITE_ATTR
      }
    ).then(result => result.records);
  }

  async getPreset({ id }) {
    return Records.get(ID.getFull(id)).load({
      authority: 'authority',
      authorities: 'authorities[]',
      journalId: 'journalId',
      name: 'name?json',
      displayName: '?disp',
      settings: 'settings?json',
      editable: PERMISSION_WRITE_ATTR
    });
  }

  async savePreset({ id, name, authority, authorities, journalId, settings }) {
    const record = Records.get(ID.getFull(id));

    record.att('name', name);
    record.att('authority', authority);
    record.att('authorities', authorities);
    record.att('journalId', journalId);
    record.att('settings?json', settings);

    return record.save();
  }

  async saveSettings({ id, settings }) {
    if (ID.empty(id)) {
      return;
    }

    const record = Records.get(ID.getFull(id));

    record.att('settings?json', settings);

    return record.save();
  }

  async deletePreset({ id }) {
    return Records.remove([ID.getFull(id)]);
  }
}

const INSTANCE = new PresetsServiceApi();
export default INSTANCE;
