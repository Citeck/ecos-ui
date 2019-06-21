import * as React from 'react';
import { stateTaskBtn } from './utils';
import { Btn } from '../common/btns';
import { t } from '../../helpers/util';

class StateBtn extends React.Component {
  render() {
    const { state, onClickState, small = false } = this.props;
    const stateInfo = stateTaskBtn().find(item => item.state === state);

    return (
      <Btn onClick={onClickState} className={small ? 'ecos-btn_narrow' : ''}>
        {t(stateInfo.label)}
      </Btn>
    );
  }
}
