import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

interface NavigationProps {
  activeContest?: any;
}

const Navigation: React.FC<NavigationProps> = ({ activeContest }) => {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-header">
          <div className="nav-brand">
            <img src="/logo.png" alt="CortiContest" className="logo-image" />
            {activeContest && (
              <div className="contest-name">{activeContest.nom}</div>
            )}
          </div>
        </div>
        <ul className="nav-menu">
          <li className={`nav-item ${location.pathname === '/inscription' ? 'active' : ''}`}>
            <Link to="/inscription">Inscription</Link>
          </li>
          <li className={`nav-item ${location.pathname === '/validation' ? 'active' : ''}`}>
            <Link to="/validation">Validation</Link>
          </li>
          <li className={`nav-item ${location.pathname === '/classement' ? 'active' : ''}`}>
            <Link to="/classement">Classement</Link>
          </li>
          <li className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}>
            <Link to="/admin">Admin</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
