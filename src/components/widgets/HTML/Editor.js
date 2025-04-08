import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import AceEditor from 'react-ace';
import { connect } from 'react-redux';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-monokai';

import { setEditorMode, updateHtmlWidget } from '../../../actions/customWidgetHtml';
import { t } from '../../../helpers/export/util';
import { wrapArgs } from '../../../helpers/redux';
import { getDOMElementMeasurer, getHtmlIdByUid } from '../../../helpers/util';
import { selectCustomWidgetData } from '../../../selectors/customWidgetHtml';
import { Btn } from '../../common/btns';
import { Caption, Field, MLText } from '../../common/form';

import { Labels } from './util';
import './styles.scss';

class EditorCustomHtmlWidget extends Component {
  #editorId = getHtmlIdByUid(undefined, 'ml-textarea');

  constructor(props) {
    super(props);

    this.state = {
      htmlString: get(props, 'config.htmlString', null),
      title: get(props, 'config.title', ''),
      _ref: null
    };
  }

  get isSmall() {
    const measurer = getDOMElementMeasurer(this.state._ref);

    return measurer && !!measurer.width && (measurer.xs || measurer.xxs || measurer.xxxs);
  }

  setEditorRef = _ref => {
    if (_ref) {
      this.setState({ _ref });
    }
  };

  onCloseEditor = () => {
    this.props.setEditorMode(false);
  };

  onSave = () => {
    const { onSave } = this.props;
    const { htmlString, title } = this.state;

    this.props.updateHtmlWidget(htmlString);

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
    const { loading } = this.props;
    const { htmlString, title } = this.state;

    const isDisableSave = !htmlString || loading;

    return (
      <div className="citeck-html-widget__editor" ref={this.setEditorRef}>
        <Caption middle className="citeck-html-widget__editor-title">
          {t(Labels.Editor.EDITOR_TITLE)}
        </Caption>

        <Field
          label={t(Labels.Editor.TITLE_FIELD_WIDGET)}
          className="citeck-html-widget__editor_field"
          labelPosition="top"
          isSmall={this.isSmall}
        >
          <MLText value={title} onChange={title => this.onChangeSetting({ title })} />
        </Field>

        <Field
          label={t(Labels.Editor.HTML_FIELD_LABEL)}
          className="citeck-html-widget__editor_field"
          labelPosition="top"
          isSmall={this.isSmall}
        >
          <AceEditor
            mode="html"
            value={htmlString}
            enableSnippets
            enableBasicAutocompletion
            enableLiveAutocompletion
            setOptions={{
              useWorker: false,
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              showLineNumbers: true,
              tabSize: 3
            }}
            style={{ width: 'auto' }}
            editorProps={{
              $blockScrolling: true
            }}
            name={this.#editorId}
            onChange={htmlString => this.onChangeSetting({ htmlString })}
          />
        </Field>

        <div className="citeck-html-widget__editor-buttons">
          <Btn className="ecos-btn_hover_light-blue" onClick={this.onCloseEditor}>
            {t(Labels.Editor.ACTION_CANCEL)}
          </Btn>
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" loading={loading} disabled={isDisableSave} onClick={this.onSave}>
            {t(Labels.Editor.ACTION_SAVE)}
          </Btn>
        </div>
      </div>
    );
  }
}

EditorCustomHtmlWidget.propTypes = {
  onSave: PropTypes.func.isRequired,
  stateId: PropTypes.string.isRequired,
  config: PropTypes.object,
  setEditorMode: PropTypes.func,
  updateHtmlWidget: PropTypes.func
};

const mapStateToProps = (state, props) => selectCustomWidgetData(state, props.stateId);
const mapDispatchToProps = (dispatch, props) => {
  const stateId = props.stateId;
  const w = wrapArgs(stateId);

  return {
    setEditorMode: isVisible => dispatch(setEditorMode(w(isVisible))),
    updateHtmlWidget: html => dispatch(updateHtmlWidget({ html, stateId }))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EditorCustomHtmlWidget);
