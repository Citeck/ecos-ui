import React from 'react';
import Components from 'formiojs/components/Components';
import _ from 'lodash';

import DefaultGqlFormatter from './DefaultGqlFormatter';

export default class FormFieldFormatter extends DefaultGqlFormatter {
  constructor(props) {
    super(props);
    this.state = {
      displayNames: []
    };
  }

  componentDidMount() {
    let cellValue = this.props.cell;

    if (!cellValue) {
      return;
    }

    let evalDisplayName = v => v;

    let component = _.get(this.props, 'params.component', {});
    if (component.type) {
      let componentClass = Components.components[component.type];
      if (componentClass && componentClass.getValueDisplayName) {
        evalDisplayName = v => componentClass.getValueDisplayName(component, v);
      }
    }

    let displayNames = (Array.isArray(cellValue) ? cellValue : [cellValue]).map(value => {
      return Promise.resolve(evalDisplayName(value)).catch(err => {
        console.error(err);
        return value;
      });
    });

    Promise.all(displayNames).then(displayNames => {
      this.setState({ displayNames });
    });
  }

  renderList() {
    const names = this.state.displayNames || [];

    return (
      <ul>
        {names.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    );
  }

  render() {
    const names = this.state.displayNames || [];

    if (names.length === 0) {
      return null;
    }

    if (names.length === 1) {
      return <this.PopperWrapper text={names[0]} />;
    }

    return <this.PopperWrapper contentComponent={this.renderList()} />;
  }
}
