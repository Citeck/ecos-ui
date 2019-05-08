import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import PDFJS from 'pdfjs-dist/webpack';

class DocPreview extends Component {
  static propTypes = {
    link: PropTypes.string.isRequired,
    scale: PropTypes.number
  };

  static defaultProps = {
    scale: 1.5
  };

  constructor(props) {
    super(props);

    this.state = {
      pdf: null,
      scale: props.scale
    };
  }

  componentDidMount() {
    let { link } = this.props;

    //PDFJS.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.js');

    let loadingTask = PDFJS.getDocument(link);

    loadingTask.promise.then(
      doc => {
        console.log(`Document loaded: ${doc.numPages} page(s)`, doc);
        this.setState({ pdf: doc });
      },
      reason => {
        console.error(`Error during loading document: ${reason}`);
      }
    );
  }

  render() {
    let { _pdfInfo } = this.state.pdf || {};
    let { numPages } = _pdfInfo || 0;
    let arrayPages = [];

    while (numPages) {
      arrayPages.push(numPages--);
    }
    arrayPages.reverse();

    return (
      <div className={classNames('ecos-doc-preview-dashlet')}>
        {arrayPages.map(pageN => {
          /*<DocPage config={this.state} page={pageN}/>*/
        })}
      </div>
    );
  }
}

export default DocPreview;
