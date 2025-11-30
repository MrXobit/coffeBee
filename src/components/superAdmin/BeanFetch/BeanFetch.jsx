import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './BeanFetch.css'
import { v4 as uuidv4 } from 'uuid'
import { collection, addDoc, query, where, getDocs, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import RoasterInfo from './components/RoasterInfo/RoasterInfo'
import ParsingForm from './components/ParsingForm/ParsingForm'
import ResultsSection from './components/RoasterInfo/ResultsSection/ResultsSection'
import JsonModal from './components/JsonModal/JsonModal'
import RoasterSelector from './components/RoasterSelector/RoasterSelector'
import NotificationModal from './components/NotificationModal/NotificationModal'

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
]

const BeanFetch = () => {
  const loadState = () => {
    try {
      const savedState = sessionStorage.getItem('beanFetchState')
      if (savedState) {
        return JSON.parse(savedState)
      }
    } catch (error) {
      console.error('Error loading state from sessionStorage:', error)
    }
    return null
  }

  const saveState = (state) => {
    try {
      sessionStorage.setItem('beanFetchState', JSON.stringify(state))
    } catch (error) {
      console.error('Error saving state to sessionStorage:', error)
    }
  }

  const savedState = loadState()

  const [siteUrl, setSiteUrl] = useState(savedState?.siteUrl || '')
  const [nameBean, setBeanName] = useState(savedState?.nameBean || '')
  const [beans, setBeans] = useState(savedState?.beans || [{ name: '', container: '' }])
  const [selectedRoaster, setSelectedRoaster] = useState(savedState?.selectedRoaster || null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [continueLoading, setContinueLoading] = useState(false)
  const [loadMoreUrl, setLoadMoreUrl] = useState('')
  const [showJson, setShowJson] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showRoasterSelector, setShowRoasterSelector] = useState(false)
  const [addingToDatabase, setAddingToDatabase] = useState(false)
  const [notification, setNotification] = useState(null)

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
  }

  const closeNotification = () => {
    setNotification(null)
  }

  useEffect(() => {
    const savedState = loadState()
    if (savedState) {
      setSiteUrl(savedState.siteUrl || '')
      setBeanName(savedState.nameBean || '')
      setBeans(savedState.beans || [{ name: '', container: '' }])
      setSelectedRoaster(savedState.selectedRoaster || null)
    }
  }, [])

  useEffect(() => {
    const stateToSave = {
      siteUrl,
      nameBean,
      beans,
      selectedRoaster
    }
    saveState(stateToSave)
  }, [siteUrl, nameBean, beans, selectedRoaster])

  const handleRoasterSelect = (roaster) => {
    setSelectedRoaster(roaster)
    if (roaster?.shop) {
      setSiteUrl(roaster.shop)
    }
  }

  const clearRoasterSelection = () => {
    setSelectedRoaster(null)
    setSiteUrl('')
    setBeanName('')
    setBeans([{ name: '', container: '' }])
    setResults(null)
    setLoadMoreUrl('')
    setShowJson(false)
    setSelectedProduct(null)
    setLoading(false)
    setContinueLoading(false)
    sessionStorage.removeItem('beanFetchState')
  }

  const addToDatabase = async () => {
    if (!selectedRoaster || !results || !results.data) {
      showNotification('No roaster selected or no data to add to database', 'error')
      return
    }

    setAddingToDatabase(true)

    try {
      const uniqueProducts = results.data.filter((product, index, self) => 
        index === self.findIndex(p => p.name === product.name && p.name !== "Not found")
      ).filter(product => !product.error && product.name !== "Not found")
      
      if (uniqueProducts.length === 0) {
        showNotification('No valid products to add', 'warning')
        return
      }

      const beansCollection = collection(db, 'beans')
      const q = query(beansCollection, where("roaster", "==", String(selectedRoaster.id)))
      const querySnapshot = await getDocs(q)
      const existingBeans = new Map()
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        existingBeans.set(data.name, { ref: doc.ref, data: data })
      })
      
      const promises = uniqueProducts.map(async (product) => {
        const existingBean = existingBeans.get(product.name)
        
        if (existingBean) {
          const existingData = existingBean.data
          const filteredProduct = {}
          ALLOWED_FIELD_NAMES.forEach(field => {
            if (product[field] !== undefined && field !== 'id' && field !== 'roaster') {
              filteredProduct[field] = product[field]
            }
          })
          
          let hasChanges = false
          const changedFields = []
          const fieldsToRemove = []
          
          ALLOWED_FIELD_NAMES.forEach(field => {
            if (field === 'id' || field === 'roaster') return
            
            const newValue = filteredProduct[field]
            const oldValue = existingData[field]
            
            if (newValue !== undefined) {
              if (Array.isArray(oldValue) && Array.isArray(newValue)) {
                if (oldValue.join(',') !== newValue.join(',')) {
                  hasChanges = true
                  changedFields.push(field)
                }
              } else if (oldValue !== newValue) {
                hasChanges = true
                changedFields.push(field)
              }
            } else if (oldValue !== undefined && oldValue !== null && oldValue !== '') {
              hasChanges = true
              fieldsToRemove.push(field)
            }
          })
          
          if (hasChanges) {
            const updateData = { updatedAt: new Date() }
            
            Object.keys(filteredProduct).forEach(field => {
              if (filteredProduct[field] !== undefined && field !== 'id' && field !== 'roaster') {
                updateData[field] = filteredProduct[field]
              }
            })
            
            fieldsToRemove.forEach(field => {
              updateData[field] = null
            })
            
            await updateDoc(existingBean.ref, updateData)
            return { action: 'updated', name: product.name, changedFields, removedFields: fieldsToRemove }
          } else {
            return { action: 'skipped', name: product.name }
          }
        } else {
          const beanId = uuidv4()
          const beanData = {
            id: beanId,
            roaster: String(selectedRoaster.id),
            roasterName: selectedRoaster.name,
            createdAt: new Date(),
            updatedAt: new Date(),
            isVerified: true
          }
          
          ALLOWED_FIELD_NAMES.forEach(field => {
            if (product[field] !== undefined && field !== 'id' && field !== 'roaster') {
              beanData[field] = product[field]
            }
          })
          
          await setDoc(doc(db, 'beans', beanId), beanData)
          return { action: 'added', name: product.name }
        }
      })

      const operationResults = await Promise.all(promises)
      const addedCount = operationResults.filter(r => r.action === 'added').length
      const updatedCount = operationResults.filter(r => r.action === 'updated').length
      const skippedCount = operationResults.filter(r => r.action === 'skipped').length
      const totalRemovedFields = operationResults
        .filter(r => r.action === 'updated' && r.removedFields)
        .flatMap(r => r.removedFields).length

      let message = `✅ Completed: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`
      if (totalRemovedFields > 0) {
        message += `, ${totalRemovedFields} fields removed`
      }
      message += ` for ${selectedRoaster.name}`
      
      showNotification(message, 'success')
      
    } catch (err) {
      showNotification(`Error adding to database: ${err.message}`, 'error')
    } finally {
      setAddingToDatabase(false)
    }
  }

  const viewProductJson = (product) => {
    setSelectedProduct(product)
    setShowJson(true)
  }

  const removeResult = (index) => {
    if (results && results.data) {
      const updatedData = [...results.data]
      updatedData.splice(index, 1)
      setResults({
        ...results,
        data: updatedData,
        processed: results.processed - 1,
        total: results.total - 1
      })
    }
  }

  const handleLoad = async (continueToken = null, newUrl = null) => {
    const urlToUse = newUrl || siteUrl
    
    if (!urlToUse) {
      showNotification('Please enter website URL', 'warning')
      return
    }
    
    if (!nameBean) {
      showNotification('Please enter selector for bean names', 'warning')
      return
    }

    const invalidFields = validateFields()
    if (invalidFields.length > 0) {
      showNotification(`Invalid field names: ${invalidFields.join(', ')}`, 'error')
      return
    }

    if (!areAllFieldsFilled()) {
      showNotification('Please fill in all added fields or remove empty ones', 'warning')
      return
    }

    const isContinue = !!continueToken
    const isNewPage = !!newUrl
    const loadingSetter = isContinue ? setContinueLoading : setLoading

    try {
      loadingSetter(true)
      
      if (!isContinue && !isNewPage) {
        setResults(null)
      }
      
      const selector = normalizeSelector(nameBean)
      const requestData = { 
        url: urlToUse, 
        nameBean: selector, 
        beans: beans.filter(bean => bean.name && bean.container)
      }

      if (isContinue) {
        requestData.continueToken = continueToken
      }

      const response = await axios.post(
        'http://127.0.0.1:5001/coffee-bee/us-central1/getBeansByUrl',
        requestData,
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000
        }
      )
      
      const normalizeProductStructure = (product) => {
        if (product.error) return product
        
        const normalizedProduct = { name: product.name, url: product.url }
        
        if (product.elements && typeof product.elements === 'object') {
          Object.assign(normalizedProduct, product.elements)
        } else {
          ALLOWED_FIELD_NAMES.forEach(field => {
            if (product[field] !== undefined) {
              normalizedProduct[field] = product[field]
            }
          })
        }
        
        const processFlavoursField = (fieldValue) => {
          if (!fieldValue || fieldValue === 'Not found') return fieldValue
          if (Array.isArray(fieldValue)) return fieldValue
          if (typeof fieldValue === 'string') {
            return fieldValue
              .split(',')
              .map(flavour => flavour.trim())
              .filter(flavour => flavour.length > 0)
              .map(flavour => flavour.toLowerCase().replace(/\s+/g, '_'))
          }
          return fieldValue
        }
        
        if (normalizedProduct.flavours) {
          normalizedProduct.flavours = processFlavoursField(normalizedProduct.flavours)
        }
        
        if (normalizedProduct.flavoursByRoaster) {
          normalizedProduct.flavoursByRoaster = processFlavoursField(normalizedProduct.flavoursByRoaster)
        }
        
        return normalizedProduct
      }
      
      const processedResponse = {
        ...response.data,
        data: response.data.data ? response.data.data.map(normalizeProductStructure) : []
      }
      
      if ((isContinue || isNewPage) && results && results.data) {
        const normalizedExistingData = results.data.map(normalizeProductStructure)
        const normalizedNewData = processedResponse.data.map(normalizeProductStructure)
        const mergedData = {
          ...processedResponse,
          data: [...normalizedExistingData, ...normalizedNewData]
        }
        setResults(mergedData)
      } else {
        setResults(processedResponse)
      }
      
      if (processedResponse.data && processedResponse.data.length > 0) {
        const successCount = processedResponse.data.filter(item => !item.error).length
        
        if (processedResponse.hasMore) {
          showNotification(`Processed ${successCount} more products! Total: ${processedResponse.processed}/${processedResponse.total}. Click "Continue" to load more.`, 'info')
        } else if (isNewPage) {
          showNotification(`Loaded ${successCount} products from new page! Total products: ${results ? results.data.length + processedResponse.data.length : processedResponse.data.length}`, 'success')
        } else {
          showNotification(`Completed! Processed all ${processedResponse.total} products successfully.`, 'success')
        }
      } else {
        showNotification('No products found. Please check your selectors.', 'warning')
      }
    } catch (err) {
      let errorMessage = 'An error occurred'
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. The server is processing your request.'
      } else if (err.response) {
        errorMessage = err.response.data.error || err.response.statusText || 'Server error'
      } else if (err.request) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.'
      } else {
        errorMessage = err.message
      }
      showNotification(`Error: ${errorMessage}`, 'error')
    } finally {
      loadingSetter(false)
      if (isNewPage) {
        setLoadMoreUrl('')
      }
    }
  }

  const normalizeSelector = (input) => {
    if (!input || typeof input !== 'string') return ''
    const trimmed = input.trim()
    
    if (trimmed.startsWith('<')) {
      try {
        const match = trimmed.match(/<(\w+)([^>]*)>/)
        if (match) {
          const tag = match[1]
          const attrs = match[2] || ''

          const classMatch = attrs.match(/class="([^"]+)"/)
          if (classMatch) {
            const firstClass = classMatch[1].split(' ')[0]
            return `${tag}.${firstClass}`
          }
          
          const itemPropMatch = attrs.match(/itemprop="([^"]+)"/)
          if (itemPropMatch) {
            return `${tag}[itemprop="${itemPropMatch[1]}"]`
          }
          
          return tag
        }
      } catch (err) {
        console.warn('Normalize selector error:', err.message)
      }
    }
    
    return trimmed
  }

  const validateFields = () => {
    const invalidFields = beans
      .filter(bean => bean.name && bean.container)
      .filter(bean => !ALLOWED_FIELD_NAMES.includes(bean.name))
      .map(bean => bean.name)
    return invalidFields
  }

  const areAllFieldsFilled = () => {
    return beans.every(bean => 
      (bean.name && bean.container) || (!bean.name && !bean.container)
    )
  }



  return (
    <div className="beanfetch">
    

      <RoasterInfo
        selectedRoaster={selectedRoaster}
        onClearSelection={clearRoasterSelection}
        onShowRoasterSelector={() => setShowRoasterSelector(true)}
      />

      <div className="beanfetch-content">
        {selectedRoaster ? (
          <ParsingForm
            siteUrl={siteUrl}
            onSiteUrlChange={setSiteUrl}
            nameBean={nameBean}
            onNameBeanChange={setBeanName}
            beans={beans}
            onBeansChange={setBeans}
            selectedRoaster={selectedRoaster}
            loading={loading}
            continueLoading={continueLoading}
            onLoad={setResults}
            onLoadingChange={setLoading}
            onContinueLoadingChange={setContinueLoading}
            onHandleLoad={handleLoad}
            normalizeSelector={normalizeSelector} 
            validateFields={validateFields} 
            areAllFieldsFilled={areAllFieldsFilled} 
          />
        ) : (
          <div className="beanfetch-welcome">
            <div className="beanfetch-welcome-content">
              <h2>Welcome to Bean Fetch</h2>
              <p>Please select a roaster to start parsing products from their website.</p>
              <button 
                onClick={() => setShowRoasterSelector(true)}
                className="beanfetch-select-roaster-btn large"
              >
                🏭 Select Roaster from Database
              </button>
            </div>
          </div>
        )}

        {results && (
          <ResultsSection
            results={results}
            loadMoreUrl={loadMoreUrl}
            onLoadMoreUrlChange={setLoadMoreUrl}
            onContinue={setResults}
            onLoadMore={setResults}
            onClearResults={() => setResults(null)}
            selectedRoaster={selectedRoaster}
            addingToDatabase={addingToDatabase}
            onAddToDatabase={addToDatabase}
            onViewJson={viewProductJson}
            onRemoveResult={removeResult}
            loading={loading}
            continueLoading={continueLoading}
            onHandleLoad={handleLoad}
            normalizeSelector={normalizeSelector} 
            validateFields={validateFields} 
            areAllFieldsFilled={areAllFieldsFilled} 
          />
        )}

        {showJson && selectedProduct && (
          <JsonModal
            product={selectedProduct}
            onClose={() => setShowJson(false)}
          />
        )}

        <RoasterSelector
          isOpen={showRoasterSelector}
          onClose={() => setShowRoasterSelector(false)}
          onRoasterSelect={handleRoasterSelect}
        />

        {notification && (
          <NotificationModal
            message={notification.message}
            type={notification.type}
            onClose={closeNotification}
          />
        )}
      </div>
    </div>
  )
}

export default BeanFetch