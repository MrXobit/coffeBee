import React from 'react';
import './BurgerMenu.css';

const BurgerMenu = ({isChecked}) => {
  return (
    <div className='burger-menu-container'>
      <input type="checkbox" role="button" aria-label="Display the menu" className="menu" checked={isChecked}    readOnly />
    </div>
  );
};

export default BurgerMenu;
