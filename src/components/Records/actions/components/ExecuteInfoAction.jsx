import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { t } from '../../../../helpers/export/util';
import { PROXY_URI } from '../../../../constants/alfresco';
import { Loader } from '../../../common';
import { Grid } from '../../../common/grid';
import { ResultTypes } from '../util/constants';

const Labels = {
  RECORD: 'group-action.label.record',
  STATUS: 'group-action.label.status',
  MSG: 'group-action.label.message',
  ERROR: 'batch-edit.message.ERROR',
  DOWNLOAD: 'actions.document.download',
  REPORT: 'group-action.label.report'
};

const ExecuteInfoAction = React.memo((props = {}) => {
  const type = get(props, 'type');
  const renderContent = () => {
    if (type === ResultTypes.INFO) {
      return <p>{data}</p>;
    }

    return <Grid keyField={keyField} data={data} columns={columns} fixedHeader autoHeight maxHeight="calc(100vh - 200px)" />;
  };
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

  switch (type) {
    case ResultTypes.MSG: {
      keyField = 'status';
      columns = [columns[1], columns[2]];
      data = [{ ...get(props, 'data', {}) }];
      break;
    }
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
              let url = cell;

              if (cell.indexOf('workspace://SpacesStore/') !== -1) {
                url = PROXY_URI + cell;
              }

              const html = `<a href="${url}" onclick="event.stopPropagation()">${t(Labels.DOWNLOAD)}</a>`;

              return <span dangerouslySetInnerHTML={{ __html: html }} />;
            }
          }
        }
      ];
      data = [{ status: t(Labels.REPORT), link: get(props, 'data.url') }];
      break;
    }
    case ResultTypes.INFO: {
      data = get(props, 'data');
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
      {renderContent()}
    </>
  );
});

ExecuteInfoAction.propTypes = {
  type: PropTypes.string,
  options: PropTypes.object,
  data: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
};

export default ExecuteInfoAction;
