import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { RichUtils, Modifier, SelectionState, EditorState } from 'draft-js';

import { Btn, IcoBtn } from '../../../common/btns';
import ClickOutside from '../../../ClickOutside';
import { Icon } from '../../../common';
import { t } from '../../../../helpers/export/util';
import { Input } from '../../../common/form';
import {
  getNewEditorStateWithAllBlockSelected,
  getSelectionText,
  modifierSelectedBlocks,
  getSelectedBlocks,
  BUTTONS_TYPE
} from './helpers';

const Labels = {
  BTN_DELETE: 'comments-widget.editor.link.delete',
  BTN_SAVE: 'comments-widget.editor.link.save',
  LINK: 'comments-widget.editor.link',
  TEXT: 'comments-widget.editor.link.text'
};

class LinkEditor extends Component {
  static propTypes = {
    editorState: PropTypes.object.isRequired,
    onChangeState: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      linkUrl: props.linkUrl,
      linkText: props.linkText,
      isOpenLinkDialog: false
    };
  }

  get selectedBlocks() {
    const { editorState } = this.props;
    const blocks = getSelectedBlocks(editorState);

    if (!blocks) {
      return 0;
    }

    return blocks.length;
  }

  get selectionText() {
    const { editorState } = this.props;

    return getSelectionText(editorState);
  }

  get isContainsLink() {
    const { editorState } = this.props;
    const isLink = RichUtils.currentBlockContainsLink(editorState);

    if (isLink) {
      return true;
    }

    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(selection.getStartKey());
    const entityAt = block.getEntityAt(selection.getStartOffset());

    if (entityAt !== null) {
      return contentState.getEntity(entityAt).getType() === BUTTONS_TYPE.LINK;
    }

    return false;
  }

  handleToggleLinkEditor = () => {
    const { isOpenLinkDialog } = this.state;
    const newState = { isOpenLinkDialog: !isOpenLinkDialog };

    if (isOpenLinkDialog) {
      this.setState({ ...newState });
      return;
    }

    const { editorState, onChangeState } = this.props;
    const selection = editorState.getSelection();
    const isCollapsed = selection.isCollapsed();
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(selection.getStartKey());
    const entityAt = block.getEntityAt(selection.getStartOffset());
    const isLink = entityAt ? contentState.getEntity(entityAt).getType() === BUTTONS_TYPE.LINK : false;
    let url = '';

    if (isLink) {
      ({ url } = contentState.getEntity(entityAt).getData());
    }

    if (isCollapsed) {
      const newEditorState = getNewEditorStateWithAllBlockSelected(editorState);

      newState.linkText = isLink ? getSelectionText(newEditorState) : '';
      onChangeState(newEditorState);
    } else {
      newState.linkText = this.selectionText;
    }

    newState.linkUrl = url;

    this.setState({ ...newState });
  };

  modifyLink = (state, selection, entityKey) => {
    return RichUtils.toggleLink(state, selection, entityKey);
  };

  handleRemoveLink = event => {
    const { editorState, onChangeState } = this.props;
    const newEditorState = modifierSelectedBlocks(editorState, this.modifyLink, null);

    onChangeState(newEditorState, true);
    event.preventDefault();

    this.setState({
      linkText: '',
      linkUrl: '',
      isOpenLinkDialog: false
    });
  };

  handleChangeLinkUrl = event => {
    this.setState({ linkUrl: event.target.value });
  };

  handleChangeLinkText = event => {
    this.setState({ linkText: event.target.value });
  };

  handleSaveLink = event => {
    const { linkText, linkUrl } = this.state;

    if ((this.selectedBlocks === 1 && !linkText) || !linkUrl) {
      return;
    }

    const { editorState, onChangeState } = this.props;
    let contentState = editorState.getCurrentContent();

    contentState = contentState.createEntity(BUTTONS_TYPE.LINK, 'MUTABLE', { url: linkUrl, title: linkUrl });

    const entityKey = contentState.getLastCreatedEntityKey();
    let newEditorState; // = modifierSelectedBlocks(editorState, this.modifyLink, entityKey);

    if (this.selectedBlocks === 1) {
      const originSelectionState = editorState.getSelection();
      const selectionState = SelectionState.createEmpty(originSelectionState.getAnchorKey())
        .set('anchorOffset', originSelectionState.getAnchorOffset())
        .set('focusOffset', originSelectionState.getAnchorOffset() + linkText.length);

      newEditorState = EditorState.set(editorState, {
        currentContent: Modifier.replaceText(editorState.getCurrentContent(), editorState.getSelection(), linkText)
      });
      newEditorState = EditorState.acceptSelection(newEditorState, selectionState);
      newEditorState = modifierSelectedBlocks(newEditorState, this.modifyLink, entityKey);
    } else {
      newEditorState = modifierSelectedBlocks(editorState, this.modifyLink, entityKey);
    }

    event.preventDefault();
    onChangeState(newEditorState, true);

    this.setState({
      linkText: '',
      linkUrl: '',
      isOpenLinkDialog: false
    });
  };

  renderLinkEditor() {
    const { isOpenLinkDialog, linkUrl, linkText } = this.state;

    if (!isOpenLinkDialog) {
      return null;
    }

    return (
      <ClickOutside className="ecos-comments__editor-link-editor" handleClickOutside={this.handleToggleLinkEditor}>
        <div className="ecos-comments__editor-link-editor-input-container">
          <Icon className="icon-link ecos-comments__editor-link-editor-input-icon" title={t(Labels.LINK)} />
          <Input
            className="ecos-comments__editor-link-editor-input"
            placeholder={t(Labels.LINK)}
            value={linkUrl}
            onChange={this.handleChangeLinkUrl}
          />
        </div>

        {this.selectedBlocks === 1 && (
          <div className="ecos-comments__editor-link-editor-input-container">
            <Icon className="icon-edit ecos-comments__editor-link-editor-input-icon" title={t(Labels.TEXT)} />
            <Input
              className="ecos-comments__editor-link-editor-input"
              placeholder={t(Labels.TEXT)}
              value={linkText}
              onChange={this.handleChangeLinkText}
            />
          </div>
        )}

        <div className="ecos-comments__editor-link-editor-btns">
          {this.selectionText && this.isContainsLink && (
            <Btn className="ecos-btn_red" onClick={this.handleRemoveLink}>
              {t(Labels.BTN_DELETE)}
            </Btn>
          )}
          <Btn
            className={classNames('ecos-btn_blue ecos-comments__editor-link-editor-btns-save', {
              'ecos-comments__editor-link-editor-btns-save_disabled': (this.selectedBlocks === 1 && !linkText) || !linkUrl
            })}
            onClick={this.handleSaveLink}
          >
            {t(Labels.BTN_SAVE)}
          </Btn>
        </div>
      </ClickOutside>
    );
  }

  render() {
    return (
      <div className="ecos-comments__editor-link-editor-container">
        <IcoBtn
          onMouseDown={this.handleToggleLinkEditor}
          className={classNames('icon-link', 'ecos-comments__editor-button', 'ecos-comments__editor-button_link', {
            'ecos-comments__editor-button_active': this.isContainsLink
          })}
        />

        {this.renderLinkEditor()}
      </div>
    );
  }
}

export default LinkEditor;
