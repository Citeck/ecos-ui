import React from 'react';
import { connect } from 'react-redux';
import { PROCESS_MODEL_NODE_TYPE, DESIGNER_PAGE_CONTEXT, EDITOR_PAGE_CONTEXT } from '../../../constants/bpmn';
import { t } from '../../../helpers/util';
import './TopPanel.scss';

const mapStateToProps = (state, ownProps) => {
  let nodeRef = state.cardDetails.pageArgs.nodeRef;

  return {
    nodeRef,
    nodeInfo: state.cardDetails.nodes[nodeRef]
  };
};

class TopPanel extends React.Component {
  render() {
    const { nodeInfo, nodeRef } = this.props;
    const nodeType = nodeInfo.nodeType;

    const permissions = nodeInfo.permissions;

    const buttons = [];
    switch (nodeType) {
      case PROCESS_MODEL_NODE_TYPE:
        const recordId = nodeRef.replace('workspace://SpacesStore/', '');
        buttons.push({
          className: 'button button_blue back-to-list-button',
          href: DESIGNER_PAGE_CONTEXT,
          text: t('bpmn-card.go-back-to-list-button.text')
        });
        if (permissions.Write) {
          buttons.push({
            className: 'button button_blue open-editor-button',
            href: `${EDITOR_PAGE_CONTEXT}#/editor/${recordId}`,
            text: t('bpmn-card.open-editor-button.text')
          });
        }
        break;
      default:
        break;
    }

    if (buttons.length < 1) {
      return null;
    }

    return (
      <div className={'card-details-top-panel'}>
        {buttons.map((button, idx) => {
          return (
            <a key={idx} className={button.className} href={button.href}>
              {button.text}
            </a>
          );
        })}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  null
)(TopPanel);
