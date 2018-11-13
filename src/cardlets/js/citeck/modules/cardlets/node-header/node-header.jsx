import React from 'react';
import NodeCardlet from '../node-cardlet';

// import 'xstyle!./node-header.css';

const Alfresco = window.Alfresco;
const YAHOO = window.YAHOO;

export default class NodeHeader extends NodeCardlet {
  static fetchData(ownProps, onSuccess, onFailure) {
    let nodeInfo = ownProps.nodeInfo;
    onSuccess({
      htmlid: ownProps.regionId + '-node-header',
      displayName: nodeInfo.displayName,
      fileExtension: nodeInfo.fileExtension,
      version: nodeInfo.version,
      modifier: nodeInfo.modifier,
      modified: nodeInfo.modified,
      nodeRef: ownProps.nodeRef,
      likes: nodeInfo.likes,
      isFavourite: nodeInfo.isFavourite,
      qshare: nodeInfo.qshare,
      commentsCount: nodeInfo.commentsCount,
      nodeType: nodeInfo.nodeType,
      nodePath: nodeInfo.nodePath,
      controlProps: ownProps.controlProps
    });
  }

  static getModifiedInfo(modifier, modified) {
    let modifierUri = `/share/page/user/${modifier.userName}/profile`;

    let dateFormat = Alfresco.util.message('date-format.default');
    let modifiedDate = Alfresco.util.fromISO8601(modified);
    let formattedModified = Alfresco.util.formatDate(modifiedDate, dateFormat);

    let modifiedByUserText = Alfresco.util.message('cardlet.node-header.modified-by-user');
    let modifiedOnText = Alfresco.util.message('cardlet.node-header.modified-on');

    return (
      <span className="item-modifier">
        {modifiedByUserText} <a href={modifierUri}>{modifier.displayName}</a>
        {' ' + modifiedOnText + ' ' + formattedModified}
      </span>
    );
  }

  componentDidMount() {
    let data = this.props.data;

    new Alfresco.Like(data.htmlid + '-like')
      .setOptions({
        nodeRef: data.nodeRef,
        /*siteId: null,*/
        type: 'document',
        displayName: data.displayName
      })
      .display(data.likes.isLiked, data.likes.totalLikes);

    new Alfresco.Favourite(data.htmlid + '-favourite')
      .setOptions({
        nodeRef: data.nodeRef,
        type: 'document'
      })
      .display(data.isFavourite);

    new Alfresco.QuickShare(data.htmlid + '-quickshare')
      .setOptions({
        nodeRef: data.nodeRef,
        displayName: data.displayName
      })
      .display(data.qshare.sharedId, data.qshare.sharedBy);
  }

  static renderPath(path) {
    let result = [];

    if (path[0].qname != 'app:company_home') {
      return result;
    }

    let hrefBase = '/share/page/repository?path=';
    let href = '';
    for (let i = 0; i < path.length; i++) {
      let pathItemClass = 'folder-link';
      let pathItem = path[i];
      let itemLabel = pathItem.title;
      if (itemLabel == 'Хранилище') {
        itemLabel = 'Репозиторий';
      }
      if (i !== 0) {
        result.push(<span className="separator">&gt;</span>);
        pathItemClass += ' folder-open';
        href += '/' + pathItem.name;
      }
      result.push(
        <span className={pathItemClass}>
          <a href={hrefBase + encodeURIComponent(href)} target="_blank">
            {itemLabel}
          </a>
        </span>
      );
    }
    return result;
  }

  render() {
    let msg = Alfresco.util.message;
    let data = this.props.data;
    let controlProps = data.controlProps;

    let extensionImg;
    if (data.fileExtension) {
      extensionImg = (
        <img
          src={`/share/res/components/images/filetypes/${data.fileExtension}-file-48.png`}
          onError={e => {
            e.target.src = '/share/res/components/images/filetypes/generic-file-48.png';
          }}
          className="node-thumbnail"
          width="48"
        />
      );
    } else {
      extensionImg = <div />;
    }

    let onComment = () => {
      YAHOO.Bubbling.fire('commentNode', data.nodeRef);
    };

    let pathMarkup;
    if (controlProps['show-path'] !== 'false') {
      pathMarkup = <div className="node-path">{NodeHeader.renderPath(data.nodePath)}</div>;
    } else {
      pathMarkup = <div />;
    }

    return (
      <div>
        <div className="node-header">
          <div className="node-info">
            {pathMarkup}
            {extensionImg}
            <h1 className="thin dark">
              {data.displayName}
              <span id={`${data.htmlid}-document-version`} className="document-version">
                {data.version}
              </span>
            </h1>
            <div>
              {NodeHeader.getModifiedInfo(data.modifier, data.modified)}
              <span id={`${data.htmlid}-favourite`} className="item item-separator" />
              <span id={`${data.htmlid}-like`} className="item item-separator" />
              <span className="item item-separator item-social">
                <a
                  name="@commentNode"
                  rel={data.nodeRef}
                  className={`theme-color-1 comment ${data.htmlid}`}
                  title={msg('comment.document.tip')}
                  tabIndex="0"
                  onClick={onComment}
                >
                  {msg('comment.document.label')}
                </a>
              </span>
              <span id={`${data.htmlid}-quickshare`} className="item item-separator" />
            </div>
          </div>
          <div className="node-action" />
          <div className="clear" />
        </div>
      </div>
    );
  }
}
