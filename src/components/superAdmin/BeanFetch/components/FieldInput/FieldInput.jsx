import React from 'react'

const FieldInput = ({ 
  index, 
  bean, 
  onBeanChange, 
  onRemove, 
  showRemove,
  allowedFieldNames,
  normalizeSelector
}) => {
  return (
    <div className="beanfetch-bean">
      <div className="beanfetch-bean-header">
        <h4 className="beanfetch-subtitle">Field {index + 1}</h4>
        {showRemove && (
          <button 
            onClick={() => onRemove(index)}
            className="beanfetch-remove"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="beanfetch-field-with-validation">
        <input
          type="text"
          placeholder="Field name (e.g.: country, roaster, variety)"
          value={bean.name}
          onChange={(e) => onBeanChange(index, 'name', e.target.value)}
          className={`beanfetch-input ${bean.name && !allowedFieldNames.includes(bean.name) ? 'beanfetch-input-error' : ''}`}
          list="allowed-field-names"
        />
        <datalist id="allowed-field-names">
          {allowedFieldNames.map(fieldName => (
            <option key={fieldName} value={fieldName} />
          ))}
        </datalist>
        
        {bean.name && !allowedFieldNames.includes(bean.name) && (
          <div className="beanfetch-error-message">
            ❌ Invalid field name. Please use one of the allowed names above.
          </div>
        )}
      </div>
      
      <div className="beanfetch-hint">
        Internal name for this field (must be one of the allowed names)
      </div>
      
      <input
        type="text"
        placeholder="CSS selector or HTML (e.g.: .country or <span class='roaster'>)"
        value={bean.container}
        onChange={(e) => onBeanChange(index, 'container', e.target.value)}
        className="beanfetch-input"
      />
      {bean.container && (
        <div className="beanfetch-selector-preview small">
          → Will use: {normalizeSelector(bean.container)}
        </div>
      )}
      <div className="beanfetch-hint">
        CSS selector or HTML fragment to find this field on product pages
      </div>
    </div>
  );
};

export default FieldInput;