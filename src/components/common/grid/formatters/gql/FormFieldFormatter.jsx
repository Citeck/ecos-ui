import React, { Fragment } from 'react';
import DefaultGqlFormatter from './DefaultGqlFormatter';
import Components from 'formiojs/components/Components';
import _ from 'lodash';

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

  render() {
    let names = this.state.displayNames || [];
    if (names.length === 0) {
      return <Fragment />;
    } else if (names.length === 1) {
      return <Fragment>{names[0]}</Fragment>;
    } else {
      return (
        <ul>
          {names.map(name => (
            <li>{name}</li>
          ))}
        </ul>
      );
    }
  }
}
