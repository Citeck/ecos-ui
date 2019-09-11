import React, { Component } from 'react';

import DocAssotiations from '../../../components/DocAssociations';

class PageDocAssociations extends Component {
  render() {
    return (
      <>
        <div style={{ margin: '50px auto', width: '600px' }}>
          <DocAssotiations id="new-widget-doc-associations-0" />
        </div>

        <div style={{ margin: '50px auto', width: '250px' }}>
          <DocAssotiations id="new-widget-doc-associations-1" />
        </div>
      </>
    );
  }
}

export default PageDocAssociations;
