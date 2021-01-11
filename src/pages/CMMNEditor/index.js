import React from 'react';
import queryString from 'query-string';

import ModelEditor from '../../components/ModelEditor';

export default class CMMNEditorPage extends React.Component {
  render() {
    const { query } = queryString.parseUrl(window.location.href);

    return <ModelEditor type={'cmmn:Stage'} record={query.recordRef} />;
  }
}
