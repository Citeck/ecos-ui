import React, { Component } from 'react';
import { FormGroup, Label, Input, FormText, Row, Col } from 'reactstrap';

import Records from '@/components/Records/Records';
import { Btn } from '@/components/common/btns';
import Select from '@/components/common/form/Select';
import { t } from '@/helpers/util';

const Labels = {
  TITLE: 'gantt.settings.title',
  CANCEL_BUTTON: 'btn.cancel.label',
  OK_BUTTON: 'btn.apply.label',
  DATA_TYPE_LABEL: 'gantt.settings.data-type.label',
  DATA_SOURCE_LABEL: 'gantt.settings.data-source.label',
  MANUAL_DATA_SOURCE_LABEL: 'gantt.settings.manual-data-source.label',
  LINKED_WITH_TYPE_LABEL: 'gantt.settings.linked-with-type.label',
  LINKED_WITH_REF_LABEL: 'gantt.settings.linked-with-ref.label',
  STANDALONE_OPTION: 'gantt.settings.data-type.standalone',
  LINKED_OPTION: 'gantt.settings.data-type.linked',
  DATA_SOURCE_PLACEHOLDER: 'gantt.settings.data-source.placeholder',
  DATA_SOURCE_DESCRIPTION: 'gantt.settings.data-source.description',
  MANUAL_DATA_SOURCE_PLACEHOLDER: 'gantt.settings.manual-data-source.placeholder',
  MANUAL_DATA_SOURCE_DESCRIPTION: 'gantt.settings.manual-data-source.description',
  LINKED_WITH_TYPE_PLACEHOLDER: 'gantt.settings.linked-with-type.placeholder',
  LINKED_WITH_REF_PLACEHOLDER: 'gantt.settings.linked-with-ref.placeholder'
};

interface GanttSettingsProps {
  isOpen: boolean;
  settings: any;
  onHide: () => void;
  onSave: (settings: any) => void;
}

interface GanttSettingsState {
  dataType: string;
  dataSourceId: string | null;
  manualDataSourceId: string | null;
  linkedWithType: string | null;
  linkedWithRef: string | null;
  dataSources: Array<{ id: string; displayName: string }>;
  isLoadingDataSources: boolean;
}

class GanttSettings extends Component<GanttSettingsProps, GanttSettingsState> {
  static defaultProps = {
    isOpen: false,
    settings: {},
    onHide: () => {},
    onSave: () => {}
  };

  constructor(props: GanttSettingsProps) {
    super(props);

    const { settings = {} } = props;

    this.state = {
      dataType: settings.dataType || 'STANDALONE',
      dataSourceId: settings.dataSourceId || null,
      manualDataSourceId: settings.manualDataSourceId || null,
      linkedWithType: settings.linkedWithType || null,
      linkedWithRef: settings.linkedWithRef || null,
      dataSources: [],
      isLoadingDataSources: false
    };
  }

  componentDidMount() {
    this.loadDataSources();
  }

  loadDataSources = async () => {
    this.setState({ isLoadingDataSources: true });

    try {
      const sources = await Records.query(
        {
          sourceId: 'emodel/data-source',
          query: {}
        },
        ['id', 'displayName?str']
      );

      this.setState({
        dataSources: sources.records.map((record: any) => ({
          id: record.id,
          displayName: record.attributes.displayName || record.id
        })),
        isLoadingDataSources: false
      });
    } catch (error) {
      console.error('Failed to load data sources:', error);
      this.setState({ isLoadingDataSources: false });
    }
  };

  handleChangeDataType = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dataType = event.target.value;
    this.setState({ dataType });
  };

  handleChangeDataSource = (selectedOption: any) => {
    this.setState({
      dataSourceId: selectedOption ? selectedOption.id : null,
      manualDataSourceId: null // Clear manual input when selecting from dropdown
    });
  };

  handleChangeManualDataSource = (event: React.ChangeEvent<HTMLInputElement>) => {
    const manualDataSourceId = event.target.value;
    this.setState({
      manualDataSourceId,
      dataSourceId: null // Clear dropdown selection when entering manual input
    });
  };

  handleChangeLinkedWithType = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ linkedWithType: event.target.value });
  };

  handleChangeLinkedWithRef = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ linkedWithRef: event.target.value });
  };

  handleSave = () => {
    const { onSave } = this.props;
    const { dataType, dataSourceId, manualDataSourceId, linkedWithType, linkedWithRef } = this.state;

    const settings = {
      dataType,
      ...(dataType === 'LINKED' && {
        dataSourceId: manualDataSourceId ? null : dataSourceId,
        manualDataSourceId: dataSourceId ? null : manualDataSourceId,
        linkedWithType,
        linkedWithRef
      })
    };

    onSave(settings);
  };

  render() {
    const { onHide } = this.props;

    if (!this.props.isOpen) {
      return null;
    }

    const { dataType, dataSourceId, manualDataSourceId, linkedWithType, linkedWithRef, dataSources, isLoadingDataSources } = this.state;

    return (
      <>
        <FormGroup tag="fieldset">
          <legend>{t(Labels.DATA_TYPE_LABEL)}</legend>
          <FormGroup check>
            <Label check>
              <Input
                type="radio"
                name="dataType"
                value="STANDALONE"
                checked={dataType === 'STANDALONE'}
                onChange={this.handleChangeDataType}
              />{' '}
              {t(Labels.STANDALONE_OPTION)}
            </Label>
          </FormGroup>
          <FormGroup check>
            <Label check>
              <Input type="radio" name="dataType" value="LINKED" checked={dataType === 'LINKED'} onChange={this.handleChangeDataType} />{' '}
              {t(Labels.LINKED_OPTION)}
            </Label>
          </FormGroup>
        </FormGroup>

        {dataType === 'LINKED' && (
          <>
            <FormGroup>
              <Label for="dataSourceSelect">{t(Labels.DATA_SOURCE_LABEL)}</Label>
              <Select
                id="dataSourceSelect"
                options={dataSources}
                getOptionLabel={(option: any) => option.displayName}
                getOptionValue={(option: any) => option.id}
                value={dataSources.find(source => source.id === dataSourceId) || null}
                onChange={this.handleChangeDataSource}
                isClearable
                isLoading={isLoadingDataSources}
                placeholder={t(Labels.DATA_SOURCE_PLACEHOLDER)}
              />
              <FormText color="muted">{t(Labels.DATA_SOURCE_DESCRIPTION)}</FormText>
            </FormGroup>

            <FormGroup>
              <Label for="manualDataSourceInput">{t(Labels.MANUAL_DATA_SOURCE_LABEL)}</Label>
              <Input
                type="text"
                id="manualDataSourceInput"
                value={manualDataSourceId || ''}
                onChange={this.handleChangeManualDataSource}
                placeholder={t(Labels.MANUAL_DATA_SOURCE_PLACEHOLDER)}
                disabled={!!dataSourceId}
              />
              <FormText color="muted">{t(Labels.MANUAL_DATA_SOURCE_DESCRIPTION)}</FormText>
            </FormGroup>

            <Row form>
              <Col md={6}>
                <FormGroup>
                  <Label for="linkedWithTypeInput">{t(Labels.LINKED_WITH_TYPE_LABEL)}</Label>
                  <Input
                    type="text"
                    id="linkedWithTypeInput"
                    value={linkedWithType || ''}
                    onChange={this.handleChangeLinkedWithType}
                    placeholder={t(Labels.LINKED_WITH_TYPE_PLACEHOLDER)}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="linkedWithRefInput">{t(Labels.LINKED_WITH_REF_LABEL)}</Label>
                  <Input
                    type="text"
                    id="linkedWithRefInput"
                    value={linkedWithRef || ''}
                    onChange={this.handleChangeLinkedWithRef}
                    placeholder={t(Labels.LINKED_WITH_REF_PLACEHOLDER)}
                  />
                </FormGroup>
              </Col>
            </Row>
          </>
        )}
        <FormGroup className="d-flex justify-content-end mb-0">
          <Btn onClick={onHide} className="mr-3">
            {t(Labels.CANCEL_BUTTON)}
          </Btn>
          <Btn onClick={this.handleSave} className="ecos-btn_blue">
            {t(Labels.OK_BUTTON)}
          </Btn>
        </FormGroup>
      </>
    );
  }
}

export default GanttSettings;
