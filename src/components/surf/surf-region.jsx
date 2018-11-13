import React from 'react';
// import {utils as CiteckUtils} from 'js/citeck/modules/utils/citeck';
import { loadHtml } from '../../helpers/citeck';
// import 'lib/underscore';

export default class SurfRegion extends React.Component {
  constructor(props) {
    super(props);

    let htmlid = props.htmlid;
    if (!htmlid) {
      let idCounter = SurfRegion.prototype.idCounter || 0;
      htmlid = `SurfRegion-id-${idCounter}`;
      SurfRegion.prototype.idCounter = idCounter + 1;
    }

    let additionalArgs = {
      htmlid: htmlid
    };
    if (props.args.cacheAge && window.dojoConfig) {
      let cacheBust = window.dojoConfig.cacheBust;
      if (cacheBust) {
        additionalArgs['cb'] = cacheBust;
      }
    }

    this.state = {
      queryArgs: Object.assign(props.args, additionalArgs),
      rootId: `${htmlid}-root`,
      innerHtml: { __html: '' }
    };
  }

  componentDidMount() {
    let self = this;
    if (this.state.loaded === undefined) {
      self.setState({
        loaded: false,
        initialized: false
      });
      loadHtml(
        '/share/service/citeck/surf/region',
        this.state.queryArgs,
        text =>
          self.setState({
            innerHtml: { __html: text },
            loaded: true
          }),
        function() {
          self.setState({
            initialized: true
          });
          if (self.props.onInitialized != null) {
            self.props.onInitialized();
          }
        },
        function() {
          if (self.props.onInitialized != null) {
            self.props.onInitialized();
          }
        }
      );
    }
  }

  render() {
    return <div id={this.state.rootId} dangerouslySetInnerHTML={this.state.innerHtml} className={this.props.className} />;
  }
}
