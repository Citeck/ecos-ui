import React from 'react';
import get from 'lodash/get';

import { t } from '../../../../helpers/export/util';
import { PROXY_URI } from '../../../../constants/alfresco';
import { Loader } from '../../../common';
import { Grid } from '../../../common/grid';
import { ResultTypes } from '../util/actionUtils';

const Labels = {
  RECORD: 'group-action.label.record',
  STATUS: 'group-action.label.status',
  MSG: 'group-action.label.message',
  ERROR: 'batch-edit.message.ERROR',
  DOWNLOAD: 'actions.document.download',
  REPORT: 'group-action.label.report'
};

const ExecuteInfoAction = React.memo((props = {}) => {
  let keyField;
  let data;
  let columns = [
    {
      dataField: 'title',
      text: t(Labels.RECORD)
    },
    {
      dataField: 'status',
      text: t(Labels.STATUS),
      width: '275px'
    },
    {
      dataField: 'message',
      text: t(Labels.MSG)
    }
  ];

  switch (get(props, 'type')) {
    case ResultTypes.ERROR: {
      keyField = 'status';
      columns = [columns[1], columns[2]];
      data = [{ status: t(Labels.ERROR), message: get(props, 'data.message') }];
      break;
    }
    case ResultTypes.LINK: {
      keyField = 'link';
      columns = [
        columns[1],
        {
          dataField: 'link',
          text: t(Labels.DOWNLOAD),
          formatExtraData: {
            formatter: ({ cell }) => {
              const html = `<a href="${PROXY_URI + cell}" onclick="event.stopPropagation()">${t(Labels.DOWNLOAD)}</a>`;
              return <span dangerouslySetInnerHTML={{ __html: html }} />;
            }
          }
        }
      ];
      data = [{ status: t(Labels.REPORT), link: get(props, 'data.url') }];
      break;
    }
    case ResultTypes.RESULTS:
    default: {
      keyField = 'nodeRef';
      data = get(props, 'data.results') || [];
      break;
    }
  }

  return (
    <>
      {get(props.options, 'isLoading') && <Loader blur rounded />}
      {get(props.options, 'text') && <p className="font-weight-bold">{props.options.text}</p>}
      <Grid keyField={keyField} data={data} columns={columns} fixedHeader autoHeight maxHeight="calc(100vh - 200px)" />
    </>
  );
});

export default ExecuteInfoAction;
