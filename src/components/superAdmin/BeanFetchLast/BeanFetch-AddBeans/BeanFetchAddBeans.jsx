import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, updateDoc, setDoc, doc} from 'firebase/firestore'
import { db } from '../../../../firebase'
import { v4 as uuidv4 } from 'uuid'
import './BeanFetch-AddBeans.css'

// Дозволені поля для зерен
const ALLOWED_FIELD_NAMES = [
  'name', 'roasterName', 'price', 'weight', 'country', 
  'region', 'altitude', 'variety', 'process', 'producer', 'farm', 
  'flavours', 'flavoursByRoaster', 'source_url', 'url'
]

const BeanFetchAddBeans = () => {
  const [roastersData, setRoastersData] = useState([])
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingAll, setUpdatingAll] = useState(false)
  const [updateResults, setUpdateResults] = useState({
    inProgress: false,
    startTime: null,
    endTime: null,
    totalParsers: 0,
    completedParsers: 0,
    failedParsers: 0,
    results: []
  })

  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault()
      e.stopPropagation()
    }

    window.addEventListener('dragover', preventDefaults)
    window.addEventListener('drop', preventDefaults)

    return () => {
      window.removeEventListener('dragover', preventDefaults)
      window.removeEventListener('drop', preventDefaults)
    }
  }, [])

  const processFile = (file) => {
    if (file && file.type === 'application/json') {
      setFileName(file.name)
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result)
          setRoastersData(jsonData)
          setSearchQuery('')
          setUpdateResults({
            inProgress: false,
            startTime: null,
            endTime: null,
            totalParsers: 0,
            completedParsers: 0,
            failedParsers: 0,
            results: []
          })
        } catch (error) {
          alert('Error reading file: ' + error.message)
        }
      }
      
      reader.readAsText(file)
    } else {
      alert('Please upload a valid JSON file')
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    processFile(file)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    processFile(file)
  }

  const handleAddToDatabase = async () => {
    try {
      setUpdatingAll(true)
      
      setUpdateResults({
        inProgress: true,
        startTime: new Date(),
        totalParsers: roastersData.length,
        completedParsers: 0,
        failedParsers: 0,
        results: []
      })

      let totalUpdated = 0
      let totalFailed = 0

      for (const roaster of roastersData) {
        try {
          setUpdateResults(prev => ({
            ...prev,
            results: [...prev.results, {
              roasterName: roaster.roasterName,
              status: 'in_progress',
              added: 0,
              updated: 0,
              skipped: 0,
              removedFields: 0,
              totalProducts: roaster.beans.length,
              currentAction: 'Processing...'
            }]
          }))

          const beansCollection = collection(db, 'beans')
          const q = query(beansCollection, where("roaster", "==", String(roaster.roasterId)))
          const querySnapshot = await getDocs(q)
          
          const existingBeansMap = new Map()
          querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data()
            if (data.name) {
              const normalizedName = data.name
                .trim()
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[^\w\s]/g, '')
                .trim()
              existingBeansMap.set(normalizedName, {
                ref: docSnapshot.ref,
                data: data
              })
            }
          })

          let added = 0
          let updated = 0
          let skipped = 0
          let removedFields = 0

          const promises = roaster.beans.map(async (bean) => {
            const normalizedBeanName = bean.name
              .trim()
              .toLowerCase()
              .replace(/\s+/g, ' ')
              .replace(/[^\w\s]/g, '')
              .trim()

            const existingBean = existingBeansMap.get(normalizedBeanName)

            if (existingBean) {
              const existingData = existingBean.data
              let hasChanges = false
              const fieldsToRemove = []

              ALLOWED_FIELD_NAMES.forEach(field => {
                const newValue = bean[field]
                const oldValue = existingData[field]

                if (newValue !== undefined) {
                  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
                    if (JSON.stringify([...oldValue].sort()) !== JSON.stringify([...newValue].sort())) {
                      hasChanges = true
                    }
                  } else if (oldValue !== newValue) {
                    hasChanges = true
                  }
                } else if (oldValue !== undefined && oldValue !== null && oldValue !== '') {
                  hasChanges = true
                  fieldsToRemove.push(field)
                }
              })

              if (hasChanges) {
                const updateData = {
                  updatedAt: new Date(),
                  name: bean.name,
                  roaster: String(roaster.roasterId),
                  isVerified: true
                }

                ALLOWED_FIELD_NAMES.forEach(field => {
                  if (bean[field] !== undefined) {
                    updateData[field] = bean[field]
                  }
                })

                fieldsToRemove.forEach(field => {
                  updateData[field] = null
                })

                await updateDoc(existingBean.ref, updateData)
                removedFields += fieldsToRemove.length
                updated++
                return { action: 'updated' }
              } else {
                skipped++
                return { action: 'skipped' }
              }
            } else {
              const beanId = uuidv4()
              
              const beanData = {
                id: beanId,
                name: bean.name,
                roaster: String(roaster.roasterId),
                roasterName: roaster.roasterName,
                isVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
              }

              ALLOWED_FIELD_NAMES.forEach(field => {
                if (bean[field] !== undefined) {
                  beanData[field] = bean[field]
                }
              })

              await setDoc(doc(db, 'beans', beanId), beanData)
              added++
              return { action: 'added' }
            }
          })

          await Promise.all(promises)

          setUpdateResults(prev => ({
            ...prev,
            results: prev.results.map((result, index) =>
              index === prev.results.length - 1
                ? {
                    ...result,
                    status: 'success',
                    added,
                    updated,
                    skipped,
                    removedFields,
                    currentAction: null
                  }
                : result
            ),
            completedParsers: prev.completedParsers + 1
          }))

          totalUpdated++
          console.log(`✅ ${roaster.roasterName}: ${added} added, ${updated} updated, ${skipped} skipped`)

        } catch (roasterError) {
          totalFailed++
          console.error(`❌ Error updating ${roaster.roasterName}:`, roasterError.message)
          
          setUpdateResults(prev => ({
            ...prev,
            results: prev.results.map((result, index) =>
              index === prev.results.length - 1
                ? {
                    ...result,
                    status: 'failed',
                    error: roasterError.message,
                    currentAction: null
                  }
                : result
            ),
            failedParsers: prev.failedParsers + 1,
            completedParsers: prev.completedParsers + 1
          }))
        }
      }

      setUpdateResults(prev => ({
        ...prev,
        inProgress: false,
        endTime: new Date()
      }))
      
      setUpdatingAll(false)
      console.log(`🎉 Completed! Success: ${totalUpdated}, Failed: ${totalFailed}`)

    } catch (error) {
      console.error('Error adding beans to database:', error)
      setUpdatingAll(false)
      alert('Error: ' + error.message)
    }
  }

  const getRelevanceScore = (roasterName, query) => {
    if (!query) return 0
    
    const lowerName = roasterName.toLowerCase()
    const lowerQuery = query.toLowerCase()
    
    if (lowerName === lowerQuery) return 100
    if (lowerName.startsWith(lowerQuery)) return 80
    if (lowerName.includes(' ' + lowerQuery) || lowerName.includes(lowerQuery + ' ')) return 60
    if (lowerName.includes(lowerQuery)) return 40
    
    let matches = 0
    for (let char of lowerQuery) {
      if (lowerName.includes(char)) matches++
    }
    return (matches / lowerQuery.length) * 20
  }

  const getFilteredRoasters = () => {
    if (!searchQuery.trim()) return roastersData
    
    return roastersData
      .map(roaster => ({
        ...roaster,
        relevanceScore: getRelevanceScore(roaster.roasterName, searchQuery)
      }))
      .filter(roaster => roaster.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  const filteredRoasters = getFilteredRoasters()

  const getTotalStats = () => {
    return updateResults.results.reduce((acc, result) => ({
      added: acc.added + (result.added || 0),
      updated: acc.updated + (result.updated || 0),
      skipped: acc.skipped + (result.skipped || 0),
      removedFields: acc.removedFields + (result.removedFields || 0),
      totalProducts: acc.totalProducts + (result.totalProducts || 0)
    }), { added: 0, updated: 0, skipped: 0, removedFields: 0, totalProducts: 0 })
  }

  const totalStats = getTotalStats()

  return (
    <div className="bfab-container">
      <div className="bfab-header-section">
        <h1 className="bfab-title">Add Coffee Beans</h1>
        
        <div 
          className={`bfab-drop-zone ${isDragging ? 'bfab-drop-zone--dragging' : ''} ${fileName ? 'bfab-drop-zone--has-file' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            id="bfab-file-input"
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="bfab-file-input"
          />
          
          {!fileName ? (
            <>
              <div className="bfab-drop-icon">📁</div>
              <p className="bfab-drop-text">Drag & drop JSON file here</p>
              <p className="bfab-drop-subtext">or</p>
              <label htmlFor="bfab-file-input" className="bfab-file-label">
                Browse Files
              </label>
            </>
          ) : (
            <>
              <div className="bfab-drop-icon">✅</div>
              <p className="bfab-drop-text">{fileName}</p>
              <label htmlFor="bfab-file-input" className="bfab-file-label-small">
                Change File
              </label>
            </>
          )}
        </div>

        {roastersData.length > 0 && (
          <button 
            className="bfab-add-btn" 
            onClick={handleAddToDatabase}
            disabled={updatingAll}
          >
            {updatingAll ? (
              <>
                <span className="bfab-btn-spinner"></span>
                Processing...
              </>
            ) : (
              'Add Beans to Database'
            )}
          </button>
        )}

        {updatingAll && (
          <div className="bfab-progress-indicator">
            <div className="bfab-progress-bar">
              <div 
                className="bfab-progress-bar-fill"
                style={{ width: `${(updateResults.completedParsers / updateResults.totalParsers) * 100}%` }}
              ></div>
            </div>
            <p className="bfab-progress-text">
              Processing {updateResults.completedParsers} / {updateResults.totalParsers} roasteries
            </p>
          </div>
        )}
      </div>

      {updateResults.results.length > 0 && !updateResults.inProgress && (
        <div className="bfab-results-section">
          <h2 className="bfab-results-title">Processing Results</h2>
          
          <div className="bfab-summary-cards">
            <div className="bfab-summary-card bfab-summary-card--success">
              <div className="bfab-card-icon">✅</div>
              <div className="bfab-card-content">
                <div className="bfab-card-value">{updateResults.totalParsers - updateResults.failedParsers}</div>
                <div className="bfab-card-label">Successful Roasteries</div>
              </div>
            </div>

            <div className="bfab-summary-card bfab-summary-card--added">
              <div className="bfab-card-icon">➕</div>
              <div className="bfab-card-content">
                <div className="bfab-card-value">{totalStats.added}</div>
                <div className="bfab-card-label">Beans Added</div>
              </div>
            </div>

            <div className="bfab-summary-card bfab-summary-card--updated">
              <div className="bfab-card-icon">🔄</div>
              <div className="bfab-card-content">
                <div className="bfab-card-value">{totalStats.updated}</div>
                <div className="bfab-card-label">Beans Updated</div>
              </div>
            </div>

            <div className="bfab-summary-card bfab-summary-card--skipped">
              <div className="bfab-card-icon">⏭️</div>
              <div className="bfab-card-content">
                <div className="bfab-card-value">{totalStats.skipped}</div>
                <div className="bfab-card-label">Beans Skipped</div>
              </div>
            </div>

            {updateResults.failedParsers > 0 && (
              <div className="bfab-summary-card bfab-summary-card--failed">
                <div className="bfab-card-icon">❌</div>
                <div className="bfab-card-content">
                  <div className="bfab-card-value">{updateResults.failedParsers}</div>
                  <div className="bfab-card-label">Failed Roasteries</div>
                </div>
              </div>
            )}
          </div>

          <div className="bfab-detailed-results">
            <h3 className="bfab-detailed-title">Detailed Results</h3>
            {updateResults.results.map((result, index) => (
              <div key={index} className={`bfab-result-item bfab-result-item--${result.status}`}>
                <div className="bfab-result-header">
                  <span className="bfab-result-roaster">{result.roasterName}</span>
                  <span className={`bfab-result-status bfab-result-status--${result.status}`}>
                    {result.status === 'success' ? '✅ Success' : 
                     result.status === 'failed' ? '❌ Failed' : 
                     '⏳ Processing...'}
                  </span>
                </div>
                
                {result.status === 'success' && (
                  <div className="bfab-result-stats">
                    <span className="bfab-stat-item">
                      <span className="bfab-stat-label">Added:</span>
                      <strong className="bfab-stat-value">{result.added}</strong>
                    </span>
                    <span className="bfab-stat-item">
                      <span className="bfab-stat-label">Updated:</span>
                      <strong className="bfab-stat-value">{result.updated}</strong>
                    </span>
                    <span className="bfab-stat-item">
                      <span className="bfab-stat-label">Skipped:</span>
                      <strong className="bfab-stat-value">{result.skipped}</strong>
                    </span>
                    <span className="bfab-stat-item">
                      <span className="bfab-stat-label">Total:</span>
                      <strong className="bfab-stat-value">{result.totalProducts}</strong>
                    </span>
                  </div>
                )}
                
                {result.status === 'failed' && (
                  <div className="bfab-result-error">Error: {result.error}</div>
                )}
                
                {result.currentAction && (
                  <div className="bfab-result-action">{result.currentAction}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {roastersData.length > 1 && (
        <div className="bfab-search-section">
          <input
            type="text"
            placeholder="Search roasteries by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bfab-search-input"
          />
          {searchQuery && (
            <div className="bfab-search-results-info">
              Found {filteredRoasters.length} of {roastersData.length} roasteries
            </div>
          )}
        </div>
      )}

      {filteredRoasters.length > 0 && (
        <div className="bfab-roasters-list">
          {filteredRoasters.map((roaster, roasterIndex) => (
            <div key={roasterIndex} className="bfab-roaster-card">
              <div className="bfab-roaster-header">
                <h2 className="bfab-roaster-name">{roaster.roasterName}</h2>
                <span className="bfab-roaster-id">ID: {roaster.roasterId}</span>
                <span className="bfab-beans-count">{roaster.beans.length} beans</span>
              </div>

              <div className="bfab-beans-grid">
                {roaster.beans.map((bean, beanIndex) => (
                  <div key={beanIndex} className="bfab-bean-card">
                    <h3 className="bfab-bean-name">{bean.name}</h3>
                    
                    <div className="bfab-bean-info">
                      <div className="bfab-info-row">
                        <span className="bfab-label">Price:</span>
                        <span className="bfab-value bfab-value--price">{bean.price}</span>
                      </div>
                      
                      {bean.weight && (
                        <div className="bfab-info-row">
                          <span className="bfab-label">Weight:</span>
                          <span className="bfab-value">{bean.weight}</span>
                        </div>
                      )}
                      
                      {bean.country && (
                        <div className="bfab-info-row">
                          <span className="bfab-label">Country:</span>
                          <span className="bfab-value">{bean.country}</span>
                        </div>
                      )}
                      
                      {bean.region && (
                        <div className="bfab-info-row">
                          <span className="bfab-label">Region:</span>
                          <span className="bfab-value">{bean.region}</span>
                        </div>
                      )}
                      
                      {bean.altitude && (
                        <div className="bfab-info-row">
                          <span className="bfab-label">Altitude:</span>
                          <span className="bfab-value">{bean.altitude}</span>
                        </div>
                      )}
                      
                      {bean.variety && (
                        <div className="bfab-info-row">
                          <span className="bfab-label">Variety:</span>
                          <span className="bfab-value">{bean.variety}</span>
                        </div>
                      )}
                      
                      {bean.process && (
                        <div className="bfab-info-row">
                          <span className="bfab-label">Process:</span>
                          <span className="bfab-value">{bean.process}</span>
                        </div>
                      )}
                      
                      {bean.producer && (
                        <div className="bfab-info-row">
                          <span className="bfab-label">Producer:</span>
                          <span className="bfab-value">{bean.producer}</span>
                        </div>
                      )}
                      
                      {bean.farm && (
                        <div className="bfab-info-row">
                          <span className="bfab-label">Farm:</span>
                          <span className="bfab-value">{bean.farm}</span>
                        </div>
                      )}
                      
                      {bean.flavours && bean.flavours.length > 0 && (
                        <div className="bfab-info-row bfab-info-row--flavours">
                          <span className="bfab-label">Flavours:</span>
                          <div className="bfab-flavours-tags">
                            {bean.flavours.map((flavour, idx) => (
                              <span key={idx} className="bfab-flavour-tag">
                                {flavour}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {bean.source_url && (
                        <a 
                          href={bean.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bfab-source-link"
                        >
                          Source →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {roastersData.length > 0 && filteredRoasters.length === 0 && (
        <div className="bfab-empty-state">
          <p>No roasteries found matching "{searchQuery}"</p>
        </div>
      )}

      {roastersData.length === 0 && (
        <div className="bfab-empty-state">
          <p>Upload a JSON file with coffee beans data</p>
        </div>
      )}
    </div>
  )
}

export default BeanFetchAddBeans