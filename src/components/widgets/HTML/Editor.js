import React, { Component } from 'react';
import { connect } from 'react-redux';
import isFunction from 'lodash/isFunction';

import { wrapArgs } from '../../../helpers/redux';
import { setEditorMode, updateHtmlWidget } from '../../../actions/customWidgetHtml';
import { selectCustomWidgetData } from '../../../selectors/customWidgetHtml';
import { Btn } from '../../common/btns';
import { Caption, Field, MLText, Textarea } from '../../common/form';
import './styles.scss';

class EditorCustomHtmlWidget extends Component {
  constructor(props) {
    super(props);

    this.state = {
      htmlString: null,
      title: props.title || ''
    };
  }

  onCloseEditor = () => {
    this.props.setEditorMode(false);
  };

  onSave = () => {
    const { onSave } = this.props;
    const { htmlString, title } = this.state;

    this.props.updateHtmlWidget(htmlString);
    this.onCloseEditor();

    isFunction(onSave) &&
      onSave({
        title,
        htmlString
      });
  };

  onChangeSetting = newSetting => {
    this.setState(prev => ({
      ...prev,
      ...newSetting
    }));
  };

  render() {
    const { loading, text } = this.props;
    const { htmlString, title } = this.state;

    const isDisableSave = !htmlString || loading;

    return (
      <div className="citeck-html-widget__editor">
        <Caption middle className="citeck-html-widget__editor-title">
          {'Настройки виджета'}
        </Caption>

        <Field label={'Название виджета'} labelPosition="top">
          <MLText value={title} onChange={title => this.onChangeSetting({ title })} />
        </Field>

        <Field label={'Произвольный HTML'} labelPosition="top">
          <Textarea
            defaultValue={text}
            value={htmlString}
            onChange={event => this.onChangeSetting({ htmlString: event?.target?.value || '' })}
          />
        </Field>

        <div className="citeck-html-widget__editor-buttons">
          <Btn className="ecos-btn_hover_light-blue" onClick={this.onCloseEditor}>
            {'Отменить'}
          </Btn>
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" loading={loading} disabled={isDisableSave} onClick={this.onSave}>
            {'Сохранить'}
          </Btn>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => selectCustomWidgetData(state, props.stateId);
const mapDispatchToProps = (dispatch, props) => {
  const stateId = props.stateId;
  const w = wrapArgs(stateId);

  return {
    setEditorMode: isVisible => dispatch(setEditorMode(w(isVisible))),
    updateHtmlWidget: html => dispatch(updateHtmlWidget({ html, stateId }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorCustomHtmlWidget);
