import React from 'react';

import { extractLabel } from '../../../../../helpers/util';
import RecordActions from '../../../../Records/actions/recordActions';
import DefaultGqlFormatter from './DefaultGqlFormatter';

class ActionFormatter extends DefaultGqlFormatter {
  state = {
    info: {}
  };

  componentDidMount() {
    const info = RecordActions.getActionInfo(this.props.params);
    this.setState({ info });
  }

  onClick = () => {
    const { row, params } = this.props;
    const ref = row.id || row.recordRef;

    RecordActions.execForRecord(ref, params).then(r => r);
  };

  render() {
    const { cell } = this.props;
    const { info } = this.state;
    const actionName = extractLabel(info.name);

    return (
      <this.PopperWrapper text={cell}>
        <div className="ecos-formatter-action__text" onClick={this.onClick} title={actionName}>
          {cell}
        </div>
      </this.PopperWrapper>
    );
  }
}

export default ActionFormatter;
