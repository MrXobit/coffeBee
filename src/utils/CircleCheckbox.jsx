import React, { useState } from 'react';
import './CircleCheckbox.css';

const CircleCheckbox = ({id, onCheckChange}) => {

    const [isChecked, setIsChecked] = useState(false);

    const handleCheckboxChange = (e) => {
      const checked = e.target.checked;
      setIsChecked(checked);
      if (onCheckChange) {
        onCheckChange(id, checked); 
      }
    };

  return (
    <div className="main-container-for-circle-checkBox">
    <div className="circle-checkBox-container">
      <div className="circle-checkBox-round">
      <input 
            type="checkbox" 
            id={`circle-checkBox-${id}`} 
            checked={isChecked} 
            onChange={handleCheckboxChange} 
          />
          <label htmlFor={`circle-checkBox-${id}`}></label>
      </div>
    </div>
    </div>
  );
}

export default CircleCheckbox;
