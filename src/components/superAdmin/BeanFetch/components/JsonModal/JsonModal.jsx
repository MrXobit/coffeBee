import React from 'react'


const JsonModal = ({ product, onClose }) => {
  return (
    <div className="beanfetch-modal-overlay">
      <div className="beanfetch-modal">
        <div className="beanfetch-modal-header">
          <h3>JSON Data for: {product.name}</h3>
          <button 
            onClick={onClose}
            className="beanfetch-modal-close"
          >
            ×
          </button>
        </div>
        <div className="beanfetch-modal-content">
          <pre className="beanfetch-json-preview">
            {JSON.stringify(product, null, 2)}
          </pre>
        </div>
        <div className="beanfetch-modal-footer">
          <button 
            onClick={onClose}
            className="beanfetch-btn secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default JsonModal;