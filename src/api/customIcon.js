import { CommonApi } from './common';
import { SourcesId } from '../constants';
import Records from '../components/Records';

export class CustomIconApi extends CommonApi {
  getIcons = () => {
    return Records.query(
      {
        sourceId: SourcesId.ICON
      },
      ['data', 'format', 'id']
    );
  };

  getIconInfo = ref => {
    return Records.get(ref).load({
      data: 'data',
      format: 'format'
    });
  };

  uploadIcon = ({ format, type = 'img', data }) => {
    const icon = Records.get(SourcesId.ICON + '@');
    icon.att('type', type);
    icon.att('format', format);
    icon.att('data', data);
    icon.save();
  };

  deleteIcon = refs => {
    return Records.remove(refs);
  };
}
