import React, { Component } from 'react';

import Esign from '../../../components/Esign';

class EsignPage extends Component {
  state = {
    btn: null
  };

  constructor() {
    super();

    window.setTimeout(() => {
      this.setState({ btn: <Esign nodeRef="workspace://SpacesStore/39b19303-8fdf-42f4-90fe-a4bfe982607c" /> });
    }, 5000);
  }

  render() {
    return (
      <div>
        <Esign nodeRef="workspace://SpacesStore/e617a72f-02fa-4fcd-9ba3-685cd8b3f9f6" />
        {this.state.btn}
      </div>
    );
  }
}

export default EsignPage;
