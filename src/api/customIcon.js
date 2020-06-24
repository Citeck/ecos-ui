import { CommonApi } from './common';
import { SourcesId } from '../constants';
import Records from '../components/Records';

export class CustomIconApi extends CommonApi {
  getIcons = ({ family }) => {
    return Records.query(
      {
        sourceId: SourcesId.ICON,
        query: { family }
      },
      {
        url: 'data?str',
        type: 'type',
        value: 'id'
      }
    )
      .then(res => res.records)
      .catch(() => []);
  };

  getIconInfo = ref => {
    return Records.get(ref).load({
      url: 'data?str',
      type: 'type',
      value: 'id'
    });
  };

  uploadIcon = ({ type = 'img', data, family, config }) => {
    const icon = Records.get(SourcesId.ICON + '@');

    icon.att('family', family);
    icon.att('config', config);
    icon.att('type', type);
    icon.att('data', data);

    return icon.save();
  };

  deleteIcon = refs => {
    return Records.remove(refs);
  };
}
