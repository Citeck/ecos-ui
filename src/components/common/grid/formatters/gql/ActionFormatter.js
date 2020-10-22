import React from 'react';
import get from 'lodash/get';

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
    RecordActions.execForRecord(get(row, 'recordRef'), params).then(r => console.log(r));
  };

  render() {
    const { cell } = this.props;
    const { info } = this.state;
    const actionName = extractLabel(info.name);

    return (
      <div className="ecos-formatter-action__text" onClick={this.onClick} title={actionName}>
        {cell}
      </div>
    );
  }
}

export default ActionFormatter;
