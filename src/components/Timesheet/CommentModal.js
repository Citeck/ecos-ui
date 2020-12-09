import React from 'react';
import PropTypes from 'prop-types';

import EcosModal from '../common/EcosModal';
import { Textarea } from '../common/form';
import { Btn } from '../common/btns';
import { t } from '../../helpers/util';

const LABELS = {
  TITLE_REQUIRED: 'timesheets.modal.comment.required.title',
  TITLE: 'timesheets.modal.comment.title',
  PLACEHOLDER_REQUIRED: 'timesheets.modal.comment.required.placeholder',
  PLACEHOLDER: 'timesheets.modal.comment.placeholder',
  BTN_CANCEL: 'timesheets.modal.comment.btn.cancel',
  BTN_SEND: 'timesheets.modal.comment.btn.send'
};

class CommentModal extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    placeholder: PropTypes.string,
    isRequired: PropTypes.bool,
    isOpen: PropTypes.bool,
    comment: PropTypes.string,
    minLength: PropTypes.number,
    maxLength: PropTypes.number,
    onCancel: PropTypes.func,
    onSend: PropTypes.func
  };

  static defaultProps = {
    isOpen: false,
    isRequired: false,
    comment: '',
    minLength: 1,
    maxLength: null,
    onCancel: () => null,
    onSend: () => null
  };

  constructor(props) {
    super(props);

    this.state = {
      comment: props.comment
    };
  }

  get title() {
    const { title, isRequired } = this.props;

    if (title) {
      return title;
    }

    return t(isRequired ? LABELS.TITLE_REQUIRED : LABELS.TITLE);
  }

  get placeholder() {
    const { placeholder, isRequired } = this.props;

    if (placeholder) {
      return placeholder;
    }

    return t(isRequired ? LABELS.PLACEHOLDER_REQUIRED : LABELS.PLACEHOLDER);
  }

  get isSendDisabled() {
    const { isRequired, minLength, maxLength } = this.props;
    let isDisabled = false;

    if (isRequired) {
      if (minLength && this.comment.length < minLength) {
        isDisabled = true;
      }

      if (maxLength !== null && this.comment.length > maxLength) {
        isDisabled = true;
      }
    }

    return isDisabled;
  }

  get comment() {
    return this.state.comment.trim();
  }

  handleCancel = () => {
    this.setState({ comment: '' });
    this.props.onCancel();
  };

  handleSend = () => {
    this.setState({ comment: '' });
    this.props.onSend(this.comment);
  };

  handleChangeComment = event => {
    this.setState({ comment: event.target.value });
  };

  render() {
    const { isOpen } = this.props;

    return (
      <EcosModal className="ecos-modal_width-xs" title={this.title} isOpen={isOpen} hideModal={this.handleCancel}>
        <Textarea
          className="ecos-ts-comment-modal__textarea"
          value={this.state.comment}
          placeholder={this.placeholder}
          onChange={this.handleChangeComment}
        />

        <div className="ecos-ts-comment-modal__btns">
          <Btn className="ecos-ts-comment-modal__btns-item" onClick={this.handleCancel}>
            {t(LABELS.BTN_CANCEL)}
          </Btn>
          <Btn
            className="ecos-btn_blue ecos-btn_hover_light-blue ecos-ts-comment-modal__btns-item"
            onClick={this.handleSend}
            disabled={this.isSendDisabled}
          >
            {t(LABELS.BTN_SEND)}
          </Btn>
        </div>
      </EcosModal>
    );
  }
}

export default CommentModal;
