import React, { useState } from 'react'
import FieldInput from '../FieldInput/FieldInput'
import axios from 'axios';

const ALLOWED_FIELD_NAMES = [
  'price',
  'description',
  'country',
  'flavours', 
  'flavoursByRoaster',
  'name',
  'process',
  'producer', 
  'variety'
];

const ParsingForm = ({
  siteUrl,
  onSiteUrlChange,
  nameBean,
  onNameBeanChange,
  beans,
  onBeansChange,
  selectedRoaster,
  loading,
  continueLoading,
  onLoad,
  onLoadingChange,
  onContinueLoadingChange,
  onHandleLoad,
  normalizeSelector, // Додаємо ці функції як пропси
  validateFields,
  areAllFieldsFilled
}) => {
  
  const getSelectorPreview = (input) => {
    if (!input) return ''
    const normalized = normalizeSelector(input)
    if (normalized !== input.trim()) {
      return `→ Will use: ${normalized}`
    }
    return ''
  };

  const addBeanInput = () => {
    onBeansChange([...beans, { name: '', container: '' }])
  };

  const handleBeanChange = (index, field, value) => {
    const updated = [...beans]
    updated[index][field] = value
    onBeansChange(updated)
  };

  const removeBeanInput = (index) => {
    if (beans.length > 1) {
      onBeansChange(beans.filter((_, i) => i !== index))
    }
  };

  const handleLoadClick = () => {
    onHandleLoad(); // Викликаємо функцію з батьківського компонента
  }

  const [AiLoading, setAiLoading] = useState(false)
  const [AiError, setAiError] = useState('')


  const handleAiFindSelectors = async() => {
    setAiLoading(true)
    setAiError('')
    try {
      if(!siteUrl) return
    const result = await axios.post(
  'http://127.0.0.1:5001/coffee-bee/us-central1/AIparser',
  { shopUrl: siteUrl },
);

    if (result?.data?.productLinkSelector) {
      onNameBeanChange(result.data.productLinkSelector); 
    }

     if (result?.data?.beanSelectors && Array.isArray(result.data.beanSelectors)) {
      onBeansChange(result.data.beanSelectors);
    }

  if (result?.data?.error) {
      setAiError(result.data.error)
    }

    }catch(e) {
     console.log(e)
    }finally {
      setAiLoading(false)
    }
  }

  const selectorPreview = getSelectorPreview(nameBean)

  return (
    <div className="beanfetch-form-section">
      <div className="beanfetch-container">
        <div className="beanfetch-field">
          <label>Website URL for parsing:</label>
          <input
            type="text"
            placeholder="https://example.com/coffee"
            value={siteUrl}
            onChange={(e) => onSiteUrlChange(e.target.value)}
            className="beanfetch-input"
          />
          <div className="beanfetch-hint">
            Enter the website URL you want to parse. This URL is used only for parsing and won't be saved to database.
            {selectedRoaster.website && (
              <><br />Current website in database: <strong>{selectedRoaster.website}</strong></>
            )}
          </div>
        </div>

        <div className="beanfetch-field">
          <label>Selector for product names:</label>
          <input
            type="text"
            placeholder=".product-name or <h2 class='product-title'>"
            value={nameBean}
            onChange={(e) => onNameBeanChange(e.target.value)}
            className="beanfetch-input"
          />
          {selectorPreview && (
            <div className="beanfetch-selector-preview">
              {selectorPreview}
            </div>
          )}
          <div className="beanfetch-hint">
            You can enter:
            <br />
            • CSS selector: <code>.product-title</code>, <code>h2 a</code>
            <br />
            • HTML fragment: <code>&lt;h2 class="product-title"&gt;</code>
            <br />
            • Any valid CSS selector that contains product names with links
          </div>
        </div>

        <h3 className="beanfetch-section-title">Additional fields to parse:</h3>

        <div className="beanfetch-allowed-fields">
          <h4 className="beanfetch-allowed-title">Allowed Field Names:</h4>
          <div className="beanfetch-allowed-list">
            {ALLOWED_FIELD_NAMES.map(fieldName => (
              <span key={fieldName} className="beanfetch-allowed-tag">
                {fieldName}
              </span>
            ))}
          </div>
          <div className="beanfetch-hint">
            Only these field names are accepted. Field "name" will be used as product title.
          </div>
        </div>

        {beans.map((bean, index) => (
          <FieldInput
            key={index}
            index={index}
            bean={bean}
            onBeanChange={handleBeanChange}
            onRemove={removeBeanInput}
            showRemove={beans.length > 1}
            allowedFieldNames={ALLOWED_FIELD_NAMES}
            normalizeSelector={normalizeSelector}
          />
        ))}

        <div className="beanfetch-buttons">
          <button onClick={addBeanInput} className="beanfetch-btn secondary">
            + Add Field
          </button>
          <button
            onClick={handleLoadClick} // Виправлено: використовуємо handleLoadClick
            className="beanfetch-btn primary"
            disabled={loading || continueLoading || (validateFields && validateFields().length > 0) || (areAllFieldsFilled && !areAllFieldsFilled())}
          >
            {loading ? (
              <span className="beanfetch-loading">
                <span className="beanfetch-spinner"></span>
                Starting...
              </span>
            ) : (
              'Start Parsing'
            )}
          </button>
        </div>

        {(loading || continueLoading) && (
          <div className="beanfetch-progress">
            <div className="beanfetch-progress-text">
              ⏳ Processing products... (Auto-saves progress)
            </div>
            <div className="beanfetch-progress-bar">
              <div className="beanfetch-progress-fill"></div>
            </div>
          </div>
        )}

<button 
  disabled={!siteUrl || AiLoading}
  className={`beanfetch-aiFindSelector ${AiLoading ? 'loading with-text' : ''}`}
  onClick={handleAiFindSelectors}
>
  {AiLoading ? (
    <>
      <span className="spinner"></span>
      Searching...
    </>
  ) : 'AI find selectors'}
</button>

{AiError && (
  <p className='beanfetch-AiError'>{AiError}</p>
)}

        <div className="beanfetch-tips">
          <h4>💡 Tips:</h4>
          <ul>
            <li>Use browser DevTools to find correct selectors</li>
            <li>Test selectors on the target website first</li>
            <li>For product names, choose elements that contain both text and links</li>
            <li>System will automatically continue if timeout is reached</li>
            <li><strong>Field "name" will be used as the product title</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ParsingForm;