import Records from '../../Records/Records';
import { SourcesId } from '../../../constants';

class ID {
  static includes(id) {
    return id.includes(SourcesId.PRESETS);
  }

  static getFull(id) {
    return ID.includes(id) ? id : `${SourcesId.PRESETS}@${id}`;
  }

  static empty(id) {
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
        journalId: 'journalId',
        displayName: '?disp',
        settings: 'settings?json',
        editable: 'permissions._has.Write?bool!false'
      }
    ).then(result => result.records);
  }

  async getPreset({ id }) {
    return Records.get(ID.getFull(id)).load({
      authority: 'authority',
      journalId: 'journalId',
      name: 'name?json',
      displayName: '?disp',
      settings: 'settings?json',
      editable: 'permissions._has.Write?bool!false'
    });
  }

  async savePreset({ id, name, authority, journalId, settings }) {
    const record = Records.get(ID.getFull(id));

    record.att('name', name);
    record.att('authority', authority);
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
