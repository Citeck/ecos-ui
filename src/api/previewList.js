import Records from '../components/Records';

import { CommonApi } from './common';

export const PREVIEW_LIST_ASPECT_ATTRIBUTES = {
  title: `titleAtt`,
  description: `textAtt`,
  preview: `previewAtt`
};

export class PreviewListApi extends CommonApi {
  getPreviewListConfig = journalType => {
    return Records.get(journalType).load(
      `aspectById.listview.config{${PREVIEW_LIST_ASPECT_ATTRIBUTES.title}!'title',${PREVIEW_LIST_ASPECT_ATTRIBUTES.description}!'text',${
        PREVIEW_LIST_ASPECT_ATTRIBUTES.preview
      }!'listview:preview'}`
    );
  };
}
