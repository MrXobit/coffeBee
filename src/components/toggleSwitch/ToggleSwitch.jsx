import React, { useEffect, useState } from 'react';
import './ToggleSwitch.css';

const ToggleSwitch = ({ onToggle, toggleValue, words }) => {
  const [isAllBeans, setIsAllBeans] = useState(toggleValue);

  const handleToggle = () => {
    setIsAllBeans(!isAllBeans);
    if (onToggle) onToggle(!isAllBeans);
  };

  useEffect(() => {
    setIsAllBeans(toggleValue); 
  }, [toggleValue]);

  return (
    <div className="toggle-switch-container" onClick={handleToggle}>
      <div className={`toggle-switch ${isAllBeans ? 'left' : 'right'}`}>
        {/* {isAllBeans ? 'All Beans' : 'You Beans'} */}
        {isAllBeans ? words[0] : words[1]}
      </div>
    </div>
  );
};

export default ToggleSwitch;
