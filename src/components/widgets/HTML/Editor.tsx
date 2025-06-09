import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-monokai';

import { Btn } from '../../common/btns';
import { Caption, Checkbox, Field, MLText, MLTextarea } from '../../common/form';

import { HTMLWidgetProps, IConfigToSave } from './Widget';
import { Labels } from './constants';

import { setEditorMode, updateHtmlWidget } from '@/actions/customWidgetHtml';
import { MLLexicalEditor } from '@/components/LexicalEditor';
import { getCurrentLocale, t } from '@/helpers/export/util';
import { wrapArgs } from '@/helpers/store';
import { getDOMElementMeasurer } from '@/helpers/util';
import { selectCustomWidgetData } from '@/selectors/customWidgetHtml';
import { Dispatch, RootState } from '@/types/store';
import { MLHtmlStringType } from '@/types/store/customWidgetHtml';
import { DOMElementMeasurerType } from '@/types/utils';
import './styles.scss';

interface EditorProps {
  loading?: boolean;
  onSave: (data: IConfigToSave) => void;
  stateId: string;
  setEditorMode?: (flag: boolean) => void;
  updateHtmlWidget?: (htmlString: IConfigToSave['htmlString']) => void;
  config: HTMLWidgetProps['config'];
}

interface EditorState {
  _ref: HTMLDivElement | null;
  title: IConfigToSave['title'];
  htmlString: IConfigToSave['htmlString'];
  isWysiwygMode: IConfigToSave['isWysiwygMode'];
}

class EditorCustomHtmlWidget extends Component<EditorProps, EditorState> {
  constructor(props: EditorProps) {
    super(props);

    this.state = {
      htmlString: get(props, 'config.htmlString', {}),
      title: get(props, 'config.title', {}),
      isWysiwygMode: get(props, 'config.isWysiwygMode', true),
      _ref: null
    };
  }

  get isSmall() {
    const measurer: DOMElementMeasurerType = getDOMElementMeasurer(this.state._ref);

    return measurer && !!measurer.width && (measurer.xs || measurer.xxs || measurer.xxxs);
  }

  setEditorRef = (_ref: HTMLDivElement) => {
    if (_ref) {
      this.setState({ _ref });
    }
  };

  onCloseEditor = () => {
    this.props.setEditorMode && this.props.setEditorMode(false);
  };

  onSave = () => {
    const { onSave } = this.props;
    const { htmlString, title, isWysiwygMode } = this.state;

    this.props.updateHtmlWidget && this.props.updateHtmlWidget(htmlString);

    isFunction(onSave) &&
      onSave({
        title,
        htmlString,
        isWysiwygMode
      });
  };

  onChangeSetting = (newSetting: Partial<EditorState>) => {
    console.log('newSetting:', newSetting);
    this.setState(prev => ({
      ...prev,
      ...newSetting
    }));
  };

  render() {
    const { loading } = this.props;
    const { htmlString, title, isWysiwygMode } = this.state;

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
          <MLText value={title} onChange={(title: IConfigToSave['title']) => this.onChangeSetting({ title })} />
        </Field>

        <Field
          label={t(Labels.Editor.ENABLE_WYSIWYG_MODE)}
          className="citeck-html-widget__editor_field"
          labelPosition="top"
          isSmall={this.isSmall}
        >
          <Checkbox checked={isWysiwygMode} onClick={(isWysiwygMode: boolean) => this.onChangeSetting({ isWysiwygMode })} />
        </Field>

        <Field
          label={t(Labels.Editor.HTML_FIELD_LABEL)}
          className="citeck-html-widget__editor_field"
          labelPosition="top"
          isSmall={this.isSmall}
        >
          {isWysiwygMode ? (
            <MLLexicalEditor value={htmlString} onChange={htmlString => this.onChangeSetting({ htmlString })} />
          ) : (
            <MLTextarea
              value={htmlString}
              onChange={(htmlString: MLHtmlStringType) => this.onChangeSetting({ htmlString })}
              style={{ width: '100%', height: '100%' }}
              lang={getCurrentLocale()}
              editor
              editorLang="html"
            />
          )}
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

const mapStateToProps = (state: RootState, props: EditorProps) => selectCustomWidgetData(state, props.stateId);
const mapDispatchToProps = (
  dispatch: Dispatch,
  props: Omit<EditorProps, 'setEditorMode' | 'updateHtmlWidget'>
): Pick<EditorProps, 'setEditorMode' | 'updateHtmlWidget'> => {
  const stateId = props.stateId;
  const w = wrapArgs<boolean>(stateId);

  return {
    setEditorMode: isVisible => dispatch(setEditorMode(w(isVisible))),
    updateHtmlWidget: html => dispatch(updateHtmlWidget({ html, stateId }))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EditorCustomHtmlWidget);
