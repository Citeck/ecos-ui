import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';

import './InlineTools.scss';

const mapStateToProps = state => ({ inlineToolSettings: state.journals.inlineToolSettings });

class InlineTools extends Component {
  tools = () => {
    return (this.props.tools || []).map((action, idx) => React.cloneElement(action, { key: idx }));
  };

  render() {
    const { top, height, left } = this.props.inlineToolSettings;

    if (height) {
      return (
        <div style={{ top, left }} className={'ecos-inline-tools'}>
          <div style={{ height }} className="ecos-inline-tools-border-left" />
          <div style={{ height }} className="ecos-inline-tools-actions">
            {this.tools()}
          </div>
          <div className="ecos-inline-tools-border-bottom" />
        </div>
      );
    }

    return null;
  }
}

export default connect(mapStateToProps)(InlineTools);
