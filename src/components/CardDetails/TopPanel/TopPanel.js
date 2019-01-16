import React from 'react';
import { connect } from 'react-redux';
import { PROCESS_MODEL_NODE_TYPE, DESIGNER_PAGE_CONTEXT } from '../../../constants/bpmn';
import { t } from '../../../helpers/util';
import './TopPanel.scss';

class TopPanel extends React.Component {
  render() {
    const { nodeInfo } = this.props;
    const nodeType = nodeInfo.nodeType;

    let goBackButtonUrl = null;
    switch (nodeType) {
      case PROCESS_MODEL_NODE_TYPE:
        goBackButtonUrl = DESIGNER_PAGE_CONTEXT;
        break;
      default:
        break;
    }

    if (!goBackButtonUrl) {
      return null;
    }

    return (
      <div className={'card-details-top-panel'}>
        <a className={'button button_blue back-to-list-button'} href={goBackButtonUrl}>
          {t('bpmn-card.go-back-to-list-button.text')}
        </a>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  let nodeRef = state.cardDetails.pageArgs.nodeRef;

  return {
    nodeRef,
    nodeInfo: state.cardDetails.nodes[nodeRef]
  };
};

export default connect(
  mapStateToProps,
  null
)(TopPanel);
