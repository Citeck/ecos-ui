import React, { Component } from 'react';

import './InlineTools.scss';

class InlineTools extends Component {
  tools = () => {
    return (this.props.tools || []).map((action, idx) => React.cloneElement(action, { key: idx }));
  };

  render() {
    const { top, height, tools } = this.props;

    if (height) {
      return (
        <div style={{ top }} className="ecos-inline-tools">
          <div style={{ height }} className="ecos-inline-tools-border-left" />
          <div style={{ height }} className="ecos-inline-tools-actions">
            {/*{this.tools()}*/}
            {tools || []}
          </div>
          <div className="ecos-inline-tools-border-bottom" />
        </div>
      );
    }

    return null;
  }
}

export default InlineTools;
