import React, { Component } from 'react';

import Esign from '../../../components/Esign';

class EsignPage extends Component {
  render() {
    return (
      <div>
        <Esign nodeRef="workspace://SpacesStore/e617a72f-02fa-4fcd-9ba3-685cd8b3f9f6" />
      </div>
    );
  }
}

export default EsignPage;
