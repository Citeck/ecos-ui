import React from 'react';
import { connect } from 'react-redux';

const logoLinkHref = '/share/page';

const mapStateToProps = state => ({
  smallLogoSrc: state.slideMenu.smallLogo,
  largeLogoSrc: state.slideMenu.largeLogo
});

const LogoBlock = ({ smallLogoSrc, largeLogoSrc }) => {
  let smallLogo = null;
  if (smallLogoSrc) {
    smallLogo = <img className="slide-menu-logo__small" src={smallLogoSrc} alt="" />;
  }

  let largeLogo = null;
  if (largeLogoSrc) {
    largeLogo = <img src={largeLogoSrc} alt="" />;
  }

  return (
    <div className="slide-menu-logo">
      {smallLogo}
      <div className="slide-menu-logo__large">
        <a href={logoLinkHref}>{largeLogo}</a>
      </div>
    </div>
  );
};

export default connect(mapStateToProps)(LogoBlock);
