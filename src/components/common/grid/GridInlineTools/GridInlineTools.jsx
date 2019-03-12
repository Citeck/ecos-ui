import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';

const mapStateToProps = state => ({ inlineToolSettings: state.journals.inlineToolSettings });

class GridInlineTools extends Component {
  tools = () => {
    return (this.props.tools || []).map((action, idx) => React.cloneElement(action, { key: idx }));
  };

  render() {
    const { top, height } = this.props.inlineToolSettings;

    if (height) {
      return (
        <div style={{ top }} className={'grid__inline-tools'}>
          <div style={{ height }} className="grid__inline-tools-border-left" />
          <div style={{ height }} className="grid__inline-tools-actions">
            {this.tools()}
          </div>
          <div className="grid__inline-tools-border-bottom" />
        </div>
      );
    }

    return null;
  }
}

export default connect(mapStateToProps)(GridInlineTools);
