import React, { Component } from 'react';
import FiltersContext from './FiltersContext';

export default class FiltersProvider extends Component {
  state = {
    fields: [],
    isReady: false
  };

  componentDidMount() {
    const { columns } = this.props;
    if (columns) {
      const fields = columns.filter(item => item.default);
      this.setState({ fields, isReady: true });
    }
  }

  componentWillReceiveProps() {
    const { columns } = this.props;
    const { isReady } = this.state;

    if (columns && !isReady) {
      const fields = columns.filter(item => item.default);
      this.setState({ fields, isReady: true });
    }
  }

  render() {
    return (
      <FiltersContext.Provider
        value={{
          fields: this.state.fields,
          addField: field => {
            this.setState(prevState => {
              return {
                fields: [...prevState.fields, field]
              };
            });
          },
          removeField: e => {
            const indexToRemove = parseInt(e.target.dataset.idx);
            this.setState(prevState => {
              return {
                fields: prevState.fields.filter((_, idx) => idx !== indexToRemove)
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
