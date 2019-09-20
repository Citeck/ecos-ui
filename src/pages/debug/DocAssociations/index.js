import React, { Component } from 'react';

import DocAssotiations from '../../../components/DocAssociations';

class PageDocAssociations extends Component {
  render() {
    return (
      <>
        <div style={{ margin: '50px auto', width: '600px' }}>
          <DocAssotiations id="new-widget-doc-associations-0" record="workspace://SpacesStore/b8fd6e1b-b897-4865-96dc-668cf8131358" />
        </div>

        <div style={{ margin: '50px auto', width: '250px' }}>
          <DocAssotiations id="new-widget-doc-associations-1" record="workspace://SpacesStore/b29f6514-aa80-4919-945e-6b4b6066238f" />
        </div>
      </>
    );
  }
}

export default PageDocAssociations;
