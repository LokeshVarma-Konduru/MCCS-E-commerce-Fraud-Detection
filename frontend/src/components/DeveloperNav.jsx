import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FaHome, FaCode, FaChartLine, FaExchangeAlt } from 'react-icons/fa';

const DeveloperNav = ({ activePath }) => {
  const buildClassName = (path) => `nav-item${path === activePath ? ' active' : ''}`;

  return (
    <div className="top-navigation">
      <nav className="nav-menu">
        <Link to="/developer" className={buildClassName('/developer')}>
          <FaHome className="nav-icon" />
          <span>Dashboard</span>
        </Link>
        <Link to="/api-integration" className={buildClassName('/api-integration')}>
          <FaCode className="nav-icon" />
          <span>API Integration</span>
        </Link>
        <Link to="/model-performance" className={buildClassName('/model-performance')}>
          <FaChartLine className="nav-icon" />
          <span>Model Performance</span>
        </Link>
        <Link to="/transaction-monitoring" className={buildClassName('/transaction-monitoring')}>
          <FaExchangeAlt className="nav-icon" />
          <span>Transaction Monitoring</span>
        </Link>
      </nav>
    </div>
  );
};

DeveloperNav.propTypes = {
  activePath: PropTypes.oneOf([
    '/developer',
    '/api-integration',
    '/model-performance',
    '/transaction-monitoring'
  ])
};

DeveloperNav.defaultProps = {
  activePath: '/developer'
};

export default DeveloperNav;
