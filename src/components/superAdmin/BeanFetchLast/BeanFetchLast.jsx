import React, { useState, useEffect, useMemo } from 'react'
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore'
import { db } from '../../../firebase'
import './BeanFetchLast.css'
import BeanFetchAddBeans from './BeanFetch-AddBeans/BeanFetchAddBeans'

const BeanFetchLast = () => {
  const [activeTab, setActiveTab] = useState('roasters')
  const [roasters, setRoasters] = useState([])
  const [loadingRoasters, setLoadingRoasters] = useState(false)
  const [selectedRoaster, setSelectedRoaster] = useState(null)
  const [parserUrls, setParserUrls] = useState([])
  const [loadingParser, setLoadingParser] = useState(false)
  const [savingParser, setSavingParser] = useState(false)
  const [allParserData, setAllParserData] = useState([])
  const [loadingAllParser, setLoadingAllParser] = useState(false)
  const [editingParserId, setEditingParserId] = useState(null)
  const [editingUrls, setEditingUrls] = useState([])
  const [searchRoasters, setSearchRoasters] = useState('')
  const [searchParser, setSearchParser] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [parserToDelete, setParserToDelete] = useState(null)
  const [deletingParser, setDeletingParser] = useState(false)
  const [downloadingFiles, setDownloadingFiles] = useState(new Set())
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' // 'success', 'error', 'info'
  })

  const filteredRoasters = useMemo(() => {
    if (!searchRoasters.trim()) return roasters
    const search = searchRoasters.toLowerCase().trim()
    return roasters.filter(r => 
      r.name?.toLowerCase().includes(search)
    )
  }, [roasters, searchRoasters])

  const filteredParserData = useMemo(() => {
    if (!searchParser.trim()) return allParserData
    const search = searchParser.toLowerCase().trim()
    return allParserData.filter(p => 
      p.name?.toLowerCase().includes(search)
    )
  }, [allParserData, searchParser])

  // Modal helper function
  const showMessage = (message, title = 'Notification', type = 'info') => {
    setModalConfig({ title, message, type })
    setShowModal(true)
  }

const fetchRoasters = async () => {
  setLoadingRoasters(true)
  try {
    const roastersRef = collection(db, 'roasters')
    const snapshot = await getDocs(roastersRef)
    
    // Отримуємо всі ID з колекції parser
    const parserRef = collection(db, 'parser')
    const parserSnapshot = await getDocs(parserRef)
    const parserIds = new Set(parserSnapshot.docs.map(doc => doc.id))
    
    // Фільтруємо ростерії, виключаючи ті, що є в parser
    const roastersData = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(roaster => !parserIds.has(roaster.id))
    
    setRoasters(roastersData)
  } catch (error) {
    console.error('Error fetching roasters:', error)
  } finally {
    setLoadingRoasters(false)
  }
}

  const fetchParserData = async (roasterId) => {
    setLoadingParser(true)
    try {
      const parserRef = doc(db, 'parser', roasterId)
      const parserSnap = await getDoc(parserRef)
      
      if (parserSnap.exists()) {
        const data = parserSnap.data()
        setParserUrls(data.urls || [])
      } else {
        setParserUrls([])
      }
    } catch (error) {
      console.error('Error fetching parser data:', error)
      setParserUrls([])
    } finally {
      setLoadingParser(false)
    }
  }

  const fetchAllParserData = async () => {
    setLoadingAllParser(true)
    try {
      const parserRef = collection(db, 'parser')
      const snapshot = await getDocs(parserRef)
      const parserData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAllParserData(parserData)
    } catch (error) {
      console.error('Error fetching all parser data:', error)
    } finally {
      setLoadingAllParser(false)
    }
  }

  const handleSelectRoaster = (roaster) => {
    setSelectedRoaster(roaster)
    fetchParserData(roaster.id)
  }

  const handleBackToList = () => {
    setSelectedRoaster(null)
    setParserUrls([])
  }

  const handleAddUrl = () => {
    setParserUrls([...parserUrls, ''])
  }

  const handleUrlChange = (index, value) => {
    const newUrls = [...parserUrls]
    newUrls[index] = value
    setParserUrls(newUrls)
  }

  const handleRemoveUrl = (index) => {
    const newUrls = parserUrls.filter((_, i) => i !== index)
    setParserUrls(newUrls)
  }

  const handleSave = async () => {
    if (!selectedRoaster) return
    
    setSavingParser(true)
    try {
      const parserRef = doc(db, 'parser', selectedRoaster.id)
      const filteredUrls = parserUrls.filter(url => url.trim() !== '')
      
      await setDoc(parserRef, {
        name: selectedRoaster.name,
        urls: filteredUrls
      })
      
      setParserUrls(filteredUrls)
      showMessage('Parser data saved successfully!', 'Success', 'success')
    } catch (error) {
      console.error('Error saving parser data:', error)
      showMessage('Failed to save parser data. Please try again.', 'Error', 'error')
    } finally {
      setSavingParser(false)
    }
  }

  const handleGetFile = async (parserId) => {
    console.log('Get file for parser:', parserId)
    
    setDownloadingFiles(prev => new Set(prev).add(parserId))

    try {
      let allResults = []
      let continueFrom = null
      let hasMore = true
      let attemptCount = 0
      const maxAttempts = 50

      while (hasMore && attemptCount < maxAttempts) {
        attemptCount++
        console.log(`📡 Запит #${attemptCount}${continueFrom ? ` (продовження з індексу ${continueFrom})` : ''}`)

        const url = continueFrom !== null
          ? `http://127.0.0.1:5001/coffee-bee/us-central1/GetOllBeanLinks?parserId=${parserId}&continueFrom=${continueFrom}`
          : `http://127.0.0.1:5001/coffee-bee/us-central1/GetOllBeanLinks?parserId=${parserId}`

        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const responseData = await response.json()
        
        hasMore = response.headers.get('X-Has-More') === 'true'
        const nextContinueFrom = response.headers.get('X-Continue-From')
        
        if (nextContinueFrom) {
          continueFrom = parseInt(nextContinueFrom, 10)
        }

        if (responseData.results && Array.isArray(responseData.results)) {
          allResults = allResults.concat(responseData.results)
          console.log(`✅ Отримано ${responseData.results.length} ростерів. Всього зібрано: ${allResults.length}`)
        }

        if (!hasMore) {
          console.log('🎉 Всі дані отримано!')
          break
        }

        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (attemptCount >= maxAttempts) {
        throw new Error('Maximum attempts reached. Data might be too large.')
      }

      const totalBeans = allResults.reduce((sum, r) => sum + (r.beans?.length || 0), 0)
      const fileName = `coffee-beans-${parserId}-${Date.now()}.json`
      const finalData = JSON.stringify(allResults, null, 2)

      const blob = new Blob([finalData], { type: 'application/json' })
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      console.log(`✅ File ${fileName} downloaded successfully!`)
      showMessage(
        `Successfully downloaded ${allResults.length} roasters with ${totalBeans} links`,
        'Download Complete',
        'success'
      )

    } catch (error) {
      console.error('❌ Error getting file:', error)
      showMessage(error.message, 'Download Error', 'error')
    } finally {
      setDownloadingFiles(prev => {
        const next = new Set(prev)
        next.delete(parserId)
        return next
      })
    }
  }

  const handleStartEditParser = (parser) => {
    setEditingParserId(parser.id)
    setEditingUrls(parser.urls || [])
  }

  const handleCancelEditParser = () => {
    setEditingParserId(null)
    setEditingUrls([])
  }

  const handleEditingUrlChange = (index, value) => {
    const newUrls = [...editingUrls]
    newUrls[index] = value
    setEditingUrls(newUrls)
  }

  const handleEditingAddUrl = () => {
    setEditingUrls([...editingUrls, ''])
  }

  const handleEditingRemoveUrl = (index) => {
    const newUrls = editingUrls.filter((_, i) => i !== index)
    setEditingUrls(newUrls)
  }

  const handleSaveEditParser = async (parserId, parserName) => {
    try {
      const parserRef = doc(db, 'parser', parserId)
      const filteredUrls = editingUrls.filter(url => url.trim() !== '')
      
      await setDoc(parserRef, {
        name: parserName,
        urls: filteredUrls
      })
      
      setEditingParserId(null)
      setEditingUrls([])
      fetchAllParserData()
      showMessage('Parser data saved successfully!', 'Success', 'success')
    } catch (error) {
      console.error('Error saving parser:', error)
      showMessage('Failed to save parser data. Please try again.', 'Error', 'error')
    }
  }

  const handleDeleteParserClick = (parser) => {
    setParserToDelete(parser)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!parserToDelete) return
    
    setDeletingParser(true)
    try {
      const parserRef = doc(db, 'parser', parserToDelete.id)
      await deleteDoc(parserRef)
      
      setAllParserData(prev => prev.filter(p => p.id !== parserToDelete.id))
      
      showMessage(
        `Roaster "${parserToDelete.name}" has been deleted successfully.`,
        'Deleted',
        'success'
      )
    } catch (error) {
      console.error('Error deleting parser:', error)
      showMessage('Failed to delete roaster. Please try again.', 'Error', 'error')
    } finally {
      setDeletingParser(false)
      setShowDeleteConfirm(false)
      setParserToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
    setParserToDelete(null)
  }

  useEffect(() => {
    fetchRoasters()
  }, [])

  useEffect(() => {
    if (activeTab === 'parser') {
      fetchAllParserData()
    }
  }, [activeTab])

  const getRoasterSite = (roaster) => {
    if (roaster.shop) return roaster.shop
    if (roaster.website) return roaster.website
    return 'No available site'
  }

  const renderRoastersList = () => {
    if (loadingRoasters) {
      return (
        <div className="bfl-loading">
          <div className="bfl-spinner"></div>
          <span>Loading roasters...</span>
        </div>
      )
    }

    if (roasters.length === 0) {
      return <div className="bfl-empty">No roasters found</div>
    }

    if (filteredRoasters.length === 0) {
      return <div className="bfl-no-results">No results for "{searchRoasters}"</div>
    }

    return (
      <div className="bfl-grid">
        {filteredRoasters.map(roaster => (
          <div
            key={roaster.id}
            className="bfl-card"
            onClick={() => handleSelectRoaster(roaster)}
          >
            <p className="bfl-card-name">{roaster.name || 'Unnamed'}</p>
            <p className="bfl-card-site">{getRoasterSite(roaster)}</p>
            <span className="bfl-card-icon">→</span>
          </div>
        ))}
      </div>
    )
  }

const renderParserEditor = () => {
  if (loadingParser) {
    return (
      <div className="bfl-loading">
        <div className="bfl-spinner"></div>
        <span>Loading parser data...</span>
      </div>
    )
  }

  const isDownloading = downloadingFiles.has(selectedRoaster.id)

  // Функція для отримання сайту ростерії
  const getRoasterSite = (roaster) => {
    if (roaster.shop) return roaster.shop
    if (roaster.website) return roaster.website
    return null
  }

  const roasterSite = getRoasterSite(selectedRoaster)

  return (
    <div className="bfl-editor">
      <div className="bfl-editor-header">
        <button 
          className="bfl-back-btn"
          onClick={handleBackToList}
        >
          ← Back
        </button>
        <div className="bfl-editor-title-section">
          <h2 className="bfl-editor-title">{selectedRoaster.name}</h2>
     {roasterSite && (
  <a 
    href={roasterSite}
    target="_blank"
    rel="noopener noreferrer"
    className="bfl-editor-site"
  >
    {roasterSite}
  </a>
)}
        </div>
      </div>

      <div>
        <h3 className="bfl-section-title">Bean URLs ({parserUrls.length})</h3>
        
        <div className="bfl-url-list">
          {parserUrls.map((url, index) => (
            <div key={index} className="bfl-url-row">
              <span className="bfl-url-index">{index + 1}</span>
              <input
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                placeholder="https://example.com/bean"
                className="bfl-url-input"
              />
              <button
                className="bfl-btn bfl-btn--remove"
                onClick={() => handleRemoveUrl(index)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          className="bfl-btn bfl-btn--add"
          onClick={handleAddUrl}
        >
          + Add URL
        </button>
      </div>

      <div className="bfl-btn-group">
        <button
          className="bfl-btn bfl-btn--primary"
          onClick={handleSave}
          disabled={savingParser}
        >
          {savingParser ? 'Saving...' : 'Save'}
        </button>
        <button 
          className="bfl-btn bfl-btn--secondary"
          onClick={() => handleGetFile(selectedRoaster.id)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <span className="bfl-btn-spinner"></span>
              Downloading...
            </>
          ) : (
            <>📄 Get file</>
          )}
        </button>
      </div>
    </div>
  )
}

  const renderAllParserData = () => {
    if (loadingAllParser) {
      return (
        <div className="bfl-loading">
          <div className="bfl-spinner"></div>
          <span>Loading parser data...</span>
        </div>
      )
    }

    if (allParserData.length === 0) {
      return <div className="bfl-empty">No parser data found</div>
    }

    if (filteredParserData.length === 0) {
      return <div className="bfl-no-results">No results for "{searchParser}"</div>
    }

    return (
      <div>
        {filteredParserData.map(parser => {
          const isDownloading = downloadingFiles.has(parser.id)
          
          return (
            <div key={parser.id} className="bfl-parser-card">
              <div className="bfl-parser-header">
                <h3 className="bfl-parser-name">{parser.name || 'Unnamed'}</h3>
                <div className="bfl-parser-actions">
                  {editingParserId !== parser.id && (
                    <>
                      <button
                        className="bfl-btn bfl-btn--get-file"
                        onClick={() => handleGetFile(parser.id)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <>
                            <span className="bfl-btn-spinner"></span>
                            Loading...
                          </>
                        ) : (
                          <>📄 Get file</>
                        )}
                      </button>
                      <button
                        className="bfl-btn bfl-btn--edit"
                        onClick={() => handleStartEditParser(parser)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="bfl-btn bfl-btn--delete"
                        onClick={() => handleDeleteParserClick(parser)}
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingParserId === parser.id ? (
                <div>
                  <div className="bfl-url-list">
                    {editingUrls.map((url, index) => (
                      <div key={index} className="bfl-url-row">
                        <span className="bfl-url-index">{index + 1}</span>
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => handleEditingUrlChange(index, e.target.value)}
                          placeholder="https://example.com/bean"
                          className="bfl-url-input"
                        />
                        <button
                          className="bfl-btn bfl-btn--remove"
                          onClick={() => handleEditingRemoveUrl(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="bfl-btn bfl-btn--add"
                    onClick={handleEditingAddUrl}
                  >
                    + Add URL
                  </button>
                  <div className="bfl-edit-actions">
                    <button
                      className="bfl-btn bfl-btn--cancel"
                      onClick={handleCancelEditParser}
                    >
                      Cancel
                    </button>
                    <button
                      className="bfl-btn bfl-btn--save-small"
                      onClick={() => handleSaveEditParser(parser.id, parser.name)}
                    >
                      Save
                    </button>
                    <button 
                      className="bfl-btn bfl-btn--get-file"
                      onClick={() => handleGetFile(parser.id)}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <span className="bfl-btn-spinner"></span>
                          Loading...
                        </>
                      ) : (
                        <>📄 Get file</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="bfl-url-count">
                    URLs: {parser.urls?.length || 0}
                  </p>
                  <div className="bfl-url-tags">
                    {parser.urls?.length > 0 ? (
                      parser.urls.map((url, index) => (
                        <span key={index} className="bfl-url-tag">
                          {url}
                        </span>
                      ))
                    ) : (
                      <span className="bfl-empty-urls">
                        No saved URLs
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderDeleteConfirmation = () => {
    if (!showDeleteConfirm) return null

    return (
      <div className="bfl-modal-overlay">
        <div className="bfl-modal">
          <div className="bfl-modal-header">
            <h3 className="bfl-modal-title">Confirm Deletion</h3>
          </div>
          <div className="bfl-modal-content">
            <p>Are you sure you want to delete roaster <strong>"{parserToDelete?.name}"</strong>?</p>
            <p>This will delete all saved URLs from the parser collection.</p>
            <p className="bfl-modal-warning">⚠️ This action cannot be undone!</p>
          </div>
          <div className="bfl-modal-actions">
            <button
              className="bfl-btn bfl-btn--cancel"
              onClick={handleCancelDelete}
              disabled={deletingParser}
            >
              Cancel
            </button>
            <button
              className="bfl-btn bfl-btn--danger"
              onClick={handleConfirmDelete}
              disabled={deletingParser}
            >
              {deletingParser ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderMessageModal = () => {
    if (!showModal) return null

    return (
      <div className="bfl-modal-overlay" onClick={() => setShowModal(false)}>
        <div className="bfl-modal bfl-modal--message" onClick={(e) => e.stopPropagation()}>
          <div className={`bfl-modal-header bfl-modal-header--${modalConfig.type}`}>
            <h3 className="bfl-modal-title">
              {modalConfig.type === 'success' && '✅ '}
              {modalConfig.type === 'error' && '❌ '}
              {modalConfig.type === 'info' && 'ℹ️ '}
              {modalConfig.title}
            </h3>
          </div>
          <div className="bfl-modal-content">
            <p>{modalConfig.message}</p>
          </div>
          <div className="bfl-modal-actions">
            <button
              className="bfl-btn bfl-btn--primary"
              onClick={() => setShowModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isDownloadingAll = downloadingFiles.has('ALL')

  return (
    <div className="bfl-container">
      <div className="bfl-header">
        <h1 className="bfl-title">🫘 Bean Fetch Last</h1>
        
        <div className="bfl-tabs">
          <button
            className={`bfl-tab ${activeTab === 'roasters' ? 'bfl-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('roasters')
              setSelectedRoaster(null)
              setSearchRoasters('')
            }}
          >
            Roasters
          </button>
          <button
            className={`bfl-tab ${activeTab === 'parser' ? 'bfl-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('parser')
              setSearchParser('')
            }}
          >
            Parser Data
          </button>
          <button
            className={`bfl-tab ${activeTab === 'addBeans' ? 'bfl-tab--active' : ''}`}
            onClick={() => setActiveTab('addBeans')}
          >
            Add Beans
          </button>
        </div>
      </div>

      <div className="bfl-content">
        {activeTab === 'roasters' && !selectedRoaster && (
          <div className="bfl-search">
            <input
              type="text"
              className="bfl-search-input"
              placeholder="Search roaster..."
              value={searchRoasters}
              onChange={(e) => setSearchRoasters(e.target.value)}
            />
          </div>
        )}

        {activeTab === 'parser' && (
          <div className="bfl-search">
            <input
              type="text"
              className="bfl-search-input"
              placeholder="Search by name..."
              value={searchParser}
              onChange={(e) => setSearchParser(e.target.value)}
            />
            <button
              className="bfl-btn bfl-btn--global-get"
              onClick={() => handleGetFile('ALL')}
              disabled={isDownloadingAll}
            >
              {isDownloadingAll ? (
                <>
                  <span className="bfl-btn-spinner"></span>
                  Downloading...
                </>
              ) : (
                <>📦 Get all data</>
              )}
            </button>
          </div>
        )}

        {activeTab === 'roasters' && (
          selectedRoaster ? renderParserEditor() : renderRoastersList()
        )}
        {activeTab === 'parser' && renderAllParserData()}
        {activeTab === 'addBeans' && <BeanFetchAddBeans />}
      </div>

      {renderDeleteConfirmation()}
      {renderMessageModal()}
    </div>
  )
}

export default BeanFetchLast