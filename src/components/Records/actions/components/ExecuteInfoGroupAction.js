import React from 'react';
import get from 'lodash/get';

import { t } from '../../../../helpers/export/util';
import { PROXY_URI } from '../../../../constants/alfresco';
import { Loader } from '../../../common';
import { Grid } from '../../../common/grid';

const ExecuteInfoGroupAction = React.memo(props => {
  const groupActionResponseUrl = get(props.data, '[0].url');
  const isError = get(props.data, '[0].errMessage');

  let keyField = 'nodeRef';
  let data = props.data;
  let columns = [
    {
      dataField: 'title',
      text: t('group-action.label.record')
    },
    {
      dataField: 'status',
      text: t('group-action.label.status')
    },
    {
      dataField: 'message',
      text: t('group-action.label.message')
    }
  ];

  if (isError) {
    keyField = 'status';
    columns = [columns[1], columns[2]];
    data = [{ status: t('batch-edit.message.ERROR'), message: get(data, '[0].errMessage') }];
  } else if (groupActionResponseUrl) {
    keyField = 'link';
    columns = [
      columns[1],
      {
        dataField: 'link',
        text: t('actions.document.download'),
        formatExtraData: {
          formatter: ({ cell }) => {
            const html = `<a href="${PROXY_URI + cell}" onclick="event.stopPropagation()">${t('actions.document.download')}</a>`;
            return <span dangerouslySetInnerHTML={{ __html: html }} />;
          }
        }
      }
    ];
    data = [{ status: t('group-action.label.report'), link: groupActionResponseUrl }];
  }

  return (
    <>
      {get(props.options, 'isLoading') && <Loader blur rounded />}
      <Grid keyField={keyField} data={data} columns={columns} fixedHeader autoHeight maxHeight="calc(100vh - 170px)" />
    </>
  );
});

export default ExecuteInfoGroupAction;
