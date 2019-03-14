import React, { Component } from 'react';
import FiltersContext from './FiltersContext';
import { getPredicates, getPredicateInput } from '../util';

export default class FiltersProvider extends Component {
  state = {
    fields: [],
    isReady: false
  };

  componentDidMount() {
    const { columns } = this.props;
    if (columns) {
      this.setFields(columns.filter(item => item.default));
    }
  }

  componentWillReceiveProps() {
    const { columns } = this.props;
    const { isReady } = this.state;

    if (columns && !isReady) {
      this.setFields(columns.filter(item => item.default));
    }
  }

  setFields = fields => {
    this.setState({
      fields: fields.map(item => {
        const predicates = getPredicates(item.javaClass);
        const input = getPredicateInput(item.javaClass);
        return {
          ...item,
          predicates,
          selectedPredicate: predicates[0],
          predicateValue: input ? input.defaultValue : null,
          input
        };
      }),
      isReady: true
    });
  };

  addField = field => {
    this.setState(prevState => {
      const predicates = getPredicates(field.javaClass);
      const input = getPredicateInput(field.javaClass);
      return {
        fields: [
          ...prevState.fields,
          {
            ...field,
            predicates,
            selectedPredicate: predicates[0],
            predicateValue: input ? input.defaultValue : null,
            input
          }
        ]
      };
    });
  };

  render() {
    return (
      <FiltersContext.Provider
        value={{
          fields: this.state.fields,
          addField: field => {
            this.addField(field);
          },
          removeField: e => {
            const indexToRemove = parseInt(e.target.dataset.idx);
            this.setState(prevState => {
              return {
                fields: prevState.fields.filter((_, idx) => idx !== indexToRemove)
              };
            });
          },
          changePredicate: (indexToChange, selectedPredicate) => {
            this.setState(prevState => {
              const changedElement = prevState.fields.splice(indexToChange, 1);

              return {
                fields: [
                  ...prevState.fields.slice(0, indexToChange),
                  {
                    ...changedElement[0],
                    selectedPredicate
                  },
                  ...prevState.fields.slice(indexToChange, prevState.fields.length)
                ]
              };
            });
          },

          changePredicateValue: (indexToChange, predicateValue) => {
            this.setState(prevState => {
              const changedElement = prevState.fields.splice(indexToChange, 1);

              return {
                fields: [
                  ...prevState.fields.slice(0, indexToChange),
                  {
                    ...changedElement[0],
                    predicateValue
                  },
                  ...prevState.fields.slice(indexToChange, prevState.fields.length)
                ]
              };
            });
          }
        }}
      >
        {this.props.children}
      </FiltersContext.Provider>
    );
  }
}
