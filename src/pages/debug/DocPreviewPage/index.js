import React from 'react';
import DocPreview from '../../../components/DocPreview/DocPreview';
import DocPreviewDashlet from '../../../components/DocPreview';
import Btn from '../../../components/common/btns/Btn';

export default class DocPreviewPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      link0: 'testPdf.pdf',
      link1: 'testImg.jpg',

      link2: '',
      isLoading2: false,

      link3: '',
      isLoading3: false,

      link4: '',
      errMsg4: ''
    };
  }

  componentDidMount() {
    setTimeout(this.getLink2, 3000);
    setTimeout(this.getLink3, 5000);
    setTimeout(this.getLink4, 2000);
  }

  getLink2 = () => {
    this.setState({
      link2: '/share/proxy/alfresco/slingshot/node/content/workspace/SpacesStore/2557e4b7-725f-40f3-95da-6175a67d3b3f/sample.pdf',
      isLoading2: false
    });
  };

  getLink3 = () => {
    this.setState({ link3: 'testImg.jpg', isLoading3: false });
  };

  getLink4 = () => {
    this.setState({ link4: '', errMsg4: 'Ошибка во время загрузки' });
  };

  setLink2Local = () => {
    let { link2, link1, link0 } = this.state;
    link2 = link2 === link1 ? link0 : link1;
    this.setState({ link2 });
  };

  setLink2Remote = () => {
    this.setState({ isLoading2: true, link2: '' });
    const getLink2 = () => {
      this.setState({
        link2: '/share/proxy/alfresco/slingshot/node/content/workspace/SpacesStore/801da94d-c08a-472c-8cdd-0d50248adb0b/Договор%20№44.pdf',
        isLoading2: false
      });
    };
    setTimeout(getLink2, 2000);
  };

  render() {
    const { link0, link1, link2, isLoading2, link3, isLoading3, link4, errMsg4 } = this.state;
    const style = { display: 'flex', justifyContent: 'space-evenly', minHeight: 500 };
    const div = { width: '30%' };

    return (
      <React.Fragment>
        <h4>Динамические документы</h4>
        <div style={style}>
          <div style={div}>
            <DocPreview link={link2} isLoading={isLoading2} />
          </div>
          <div style={div}>
            <DocPreview link={link3} isLoading={isLoading3} />
          </div>
          <div style={div}>
            <h5>Ошибка</h5>
            <DocPreview link={link4} errMsg={errMsg4} />
          </div>
        </div>
        <Btn onClick={this.setLink2Local}>set local file</Btn>
        <Btn onClick={this.setLink2Remote}>set remote file</Btn>
        <h4>Статические документы</h4>
        <div style={style}>
          <div style={div}>
            <DocPreviewDashlet
              id={'dashletId-1-1-2'}
              title={'Кастомный заголовок'}
              config={{
                link: link0,
                height: 300,
                scale: 0.5
              }}
              classNameDashlet={'classNameDashlet'}
              classNamePreview={'classNamePreview'}
            />
          </div>
          <div style={div}>
            <DocPreviewDashlet id={'dashletId-1-1-2'} config={{ link: link1, scale: 1, height: 500 }} />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
