import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import BeanFetch from '../../BeanFetch'
import { db } from '../../../../../firebase'
import { collection, getDocs, deleteDoc, doc, query, where, updateDoc, setDoc } from 'firebase/firestore'
import './MainRoasterBeanFetch.css'

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

const MainRoasterBeanFetch = () => {
    const [parserData, setParserData] = useState([])
    const [filteredData, setFilteredData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showAddNew, setShowAddNew] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [updatingAll, setUpdatingAll] = useState(false)
    const [updateResults, setUpdateResults] = useState({
        inProgress: false,
        totalParsers: 0,
        completedParsers: 0,
        failedParsers: 0,
        results: [],
        startTime: null,
        endTime: null
    })
    const [showResultsModal, setShowResultsModal] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredData(parserData)
        } else {
            const filtered = parserData.filter(item => 
                item.roasterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.siteUrl?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.website?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilteredData(filtered)
        }
    }, [searchTerm, parserData])

    const fetchData = async () => {
        try {
            setLoading(true)
            const querySnapshot = await getDocs(collection(db, 'parser'))
            
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            
            setParserData(data)
            setFilteredData(data)
            setError(null)
        } catch (err) {
            console.error('Error fetching data:', err)
            setError('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteParser = async (id, roasterName) => {
        if (!window.confirm(`Are you sure you want to delete parser for "${roasterName}"? This action cannot be undone.`)) {
            return
        }

        try {
            await deleteDoc(doc(db, 'parser', id))
            const updatedData = parserData.filter(item => item.id !== id)
            setParserData(updatedData)
            setFilteredData(updatedData)
            alert(`✅ Parser for "${roasterName}" deleted successfully!`)
        } catch (err) {
            console.error('Error deleting parser:', err)
            alert(`❌ Error deleting parser: ${err.message}`)
        }
    }

    const handleUpdateAllData = async () => {
        if (!window.confirm('Are you sure you want to update all parsers? This may take a while.')) {
            return
        }

        // Ініціалізуємо результати
        setUpdateResults({
            inProgress: true,
            totalParsers: 0,
            completedParsers: 0,
            failedParsers: 0,
            results: [],
            startTime: new Date(),
            endTime: null
        })
        
        setUpdatingAll(true)
        
        // Запускаємо оновлення в окремому потоці
        updateAllParsers()
    }

const updateAllParsers = async () => {
        try {
            console.log('Starting to update all parsers...')
            
            const parsersSnapshot = await getDocs(collection(db, 'parser'))
            const parsers = parsersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            
            // Оновлюємо загальну кількість парсерів
            setUpdateResults(prev => ({
                ...prev,
                totalParsers: parsers.length
            }))
            
            let totalUpdated = 0
            let totalFailed = 0
            
            for (const parser of parsers) {
                try {
                    // Додаємо початковий запис для цього парсера
                    setUpdateResults(prev => ({
                        ...prev,
                        results: [...prev.results, {
                            roasterName: parser.roasterName,
                            status: 'in_progress',
                            added: 0,
                            updated: 0,
                            skipped: 0,
                            removedFields: 0,
                            totalProducts: 0,
                            urlsProcessed: 0,
                            currentAction: 'Starting...'
                        }]
                    }))
                    
                    console.log(`=== Processing parser for ${parser.roasterName} ===`)
                    
                    // Отримуємо всі URL для обробки
                    const urlsToProcess = []
                    
                    // Додаємо основну URL
                    if (parser.siteUrl) {
                        urlsToProcess.push({
                            url: parser.siteUrl,
                            source: 'main'
                        })
                    }
                    
                    // Додаємо loadMoreUrl якщо воно є в базі даних
                    if (parser.loadMoreUrl) {
                        urlsToProcess.push({
                            url: parser.loadMoreUrl,
                            source: 'loadMoreUrl'
                        })
                    }
                    
                    // Оновлюємо статус
                    setUpdateResults(prev => ({
                        ...prev,
                        results: prev.results.map((result, index) => 
                            index === prev.results.length - 1 
                                ? {...result, currentAction: `Processing ${urlsToProcess.length} URLs...`}
                                : result
                        )
                    }))
                    
                    let allProducts = []
                    
                    // Обробляємо кожну URL
                    for (const urlData of urlsToProcess) {
                        let currentUrl = urlData.url
                        let continueToken = null
                        let hasMore = true
                        let page = 1
                        
                        // Завантажуємо всі сторінки для даної URL
                        while (hasMore) {
                            try {
                                setUpdateResults(prev => ({
                                    ...prev,
                                    results: prev.results.map((result, index) => 
                                        index === prev.results.length - 1 
                                            ? {...result, currentAction: `Loading page ${page} from ${urlData.source}...`}
                                            : result
                                    )
                                }))
                                
                                const requestData = {
                                    url: currentUrl,
                                    nameBean: parser.nameBean,
                                    beans: parser.beans?.filter(bean => bean.name && bean.container) || []
                                }
                                
                                if (continueToken) {
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
                                
                                // Обробляємо результати
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
                                
                                const processedData = response.data.data ? 
                                    response.data.data.map(normalizeProductStructure) : []
                                
                                allProducts = [...allProducts, ...processedData]
                                
                                // Перевіряємо чи є ще сторінки
                                hasMore = response.data.hasMore || false
                                
                                // Якщо є continueToken - зберігаємо його для наступного запиту
                                if (response.data.continueToken) {
                                    const newToken = response.data.continueToken
                                    if (continueToken !== newToken) {
                                        continueToken = newToken
                                    } else {
                                        continueToken = null
                                        hasMore = false
                                    }
                                } else {
                                    continueToken = null
                                }
                                
                                // Якщо немає hasMore, виходимо з циклу
                                if (!hasMore) break
                                
                                page++
                                
                                // Пауза між запитами
                                await new Promise(resolve => setTimeout(resolve, 1500))
                                
                            } catch (pageError) {
                                console.error(`Error loading from ${urlData.source}:`, pageError.message)
                                hasMore = false
                            }
                        }
                        
                        // Пауза між різними URL
                        if (urlsToProcess.indexOf(urlData) < urlsToProcess.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 2000))
                        }
                    }
                    
                    // Оновлюємо статус
                    setUpdateResults(prev => ({
                        ...prev,
                        results: prev.results.map((result, index) => 
                            index === prev.results.length - 1 
                                ? {...result, currentAction: 'Processing data...', totalProducts: allProducts.length}
                                : result
                        )
                    }))
                    
                    // Фільтруємо дублікати
                    const validProducts = allProducts.filter(product => 
                        !product.error && 
                        product.name && 
                        product.name !== "Not found" && 
                        product.name.trim() !== ""
                    )
                    
                    // Відфільтровуємо дублікати по назві
                    const uniqueProductsMap = new Map()
                    
                    validProducts.forEach(product => {
                        const normalizedName = product.name
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, ' ')
                            .replace(/[^\w\s]/g, '')
                            .trim()
                        
                        if (!uniqueProductsMap.has(normalizedName)) {
                            uniqueProductsMap.set(normalizedName, product)
                        }
                    })
                    
                    const uniqueProducts = Array.from(uniqueProductsMap.values())
                    
                    if (uniqueProducts.length > 0) {
                        const beansCollection = collection(db, 'beans')
                        const q = query(beansCollection, where("roaster", "==", String(parser.roasterId)))
                        const querySnapshot = await getDocs(q)
                        
                        const existingBeansMap = new Map()
                        
                        querySnapshot.forEach((doc) => {
                            const data = doc.data()
                            if (data.name) {
                                const normalizedName = data.name
                                    .trim()
                                    .toLowerCase()
                                    .replace(/\s+/g, ' ')
                                    .replace(/[^\w\s]/g, '')
                                    .trim()
                                
                                existingBeansMap.set(normalizedName, { 
                                    ref: doc.ref, 
                                    data: data
                                })
                            }
                        })
                        
                        let added = 0
                        let updated = 0
                        let skipped = 0
                        let removedFields = 0
                        
                        // Оновлюємо статус
                        setUpdateResults(prev => ({
                            ...prev,
                            results: prev.results.map((result, index) => 
                                index === prev.results.length - 1 
                                    ? {...result, currentAction: 'Saving to database...'}
                                    : result
                            )
                        }))
                        
                        const promises = uniqueProducts.map(async (product) => {
                            const normalizedProductName = product.name
                                .trim()
                                .toLowerCase()
                                .replace(/\s+/g, ' ')
                                .replace(/[^\w\s]/g, '')
                                .trim()
                            
                            const existingBean = existingBeansMap.get(normalizedProductName)
                            
                            if (existingBean) {
                                const existingData = existingBean.data
                                const filteredProduct = {}
                                
                                ALLOWED_FIELD_NAMES.forEach(field => {
                                    if (product[field] !== undefined && field !== 'id' && field !== 'roaster') {
                                        filteredProduct[field] = product[field]
                                    }
                                })
                                
                                let hasChanges = false
                                const fieldsToRemove = []
                                
                                // Перевіряємо всі дозволені поля
                                ALLOWED_FIELD_NAMES.forEach(field => {
                                    if (field === 'id' || field === 'roaster') return
                                    
                                    const newValue = filteredProduct[field]
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
                                
                                // Перевіряємо URL окремо
                                if (product.url !== undefined && product.url !== existingData.url) {
                                    hasChanges = true
                                } else if (existingData.url && !product.url) {
                                    hasChanges = true
                                    fieldsToRemove.push('url')
                                }
                                
                                if (hasChanges) {
                                    const updateData = { 
                                        updatedAt: new Date(),
                                        name: product.name
                                    }
                                    
                                    Object.keys(filteredProduct).forEach(field => {
                                        if (filteredProduct[field] !== undefined && field !== 'id' && field !== 'roaster') {
                                            updateData[field] = filteredProduct[field]
                                        }
                                    })
                                    
                                    // Додаємо URL
                                    if (product.url !== undefined) {
                                        updateData.url = product.url
                                    }
                                    
                                    fieldsToRemove.forEach(field => {
                                        updateData[field] = null
                                    })
                                    
                                    await updateDoc(existingBean.ref, updateData)
                                    removedFields += fieldsToRemove.length
                                    updated++
                                    return { action: 'updated', fieldsToRemove }
                                } else {
                                    skipped++
                                    return { action: 'skipped' }
                                }
                            } else {
                                const beanId = uuidv4()
                                const beanData = {
                                    id: beanId,
                                    roaster: String(parser.roasterId),
                                    roasterName: parser.roasterName,
                                    name: product.name,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    isVerified: true
                                }
                                
                                ALLOWED_FIELD_NAMES.forEach(field => {
                                    if (product[field] !== undefined && field !== 'id' && field !== 'roaster') {
                                        beanData[field] = product[field]
                                    }
                                })
                                
                                // Додаємо URL
                                if (product.url !== undefined) {
                                    beanData.url = product.url
                                }
                                
                                await setDoc(doc(db, 'beans', beanId), beanData)
                                added++
                                return { action: 'added' }
                            }
                        })

                        await Promise.all(promises)
                        
                        // Оновлюємо результат для цього парсера
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
                                        totalProducts: uniqueProducts.length,
                                        urlsProcessed: urlsToProcess.length,
                                        currentAction: null
                                    }
                                    : result
                            ),
                            completedParsers: prev.completedParsers + 1
                        }))
                        
                        console.log(`✅ ${parser.roasterName}: ${added} added, ${updated} updated, ${skipped} skipped, ${removedFields} fields removed`)
                        
                    } else {
                        // Оновлюємо результат для цього парсера
                        setUpdateResults(prev => ({
                            ...prev,
                            results: prev.results.map((result, index) => 
                                index === prev.results.length - 1 
                                    ? {
                                        ...result,
                                        status: 'success',
                                        added: 0,
                                        updated: 0,
                                        skipped: 0,
                                        removedFields: 0,
                                        totalProducts: 0,
                                        urlsProcessed: urlsToProcess.length,
                                        currentAction: null
                                    }
                                    : result
                            ),
                            completedParsers: prev.completedParsers + 1
                        }))
                        
                        console.log(`⚠️ No valid products found for ${parser.roasterName}`)
                    }
                    
                    totalUpdated++
                    
                } catch (parserError) {
                    totalFailed++
                    console.error(`❌ Error updating parser ${parser.roasterName}:`, parserError.message)
                    
                    // Оновлюємо результат для цього парсера
                    setUpdateResults(prev => ({
                        ...prev,
                        results: prev.results.map((result, index) => 
                            index === prev.results.length - 1 
                                ? {
                                    ...result,
                                    status: 'failed',
                                    error: parserError.message,
                                    currentAction: null
                                }
                                : result
                        ),
                        failedParsers: prev.failedParsers + 1,
                        completedParsers: prev.completedParsers + 1
                    }))
                }
                
                // Пауза між парсерами
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
            
            // Завершуємо процес
            setUpdateResults(prev => ({
                ...prev,
                inProgress: false,
                endTime: new Date()
            }))
            
            setUpdatingAll(false)
            fetchData() // Оновлюємо список парсерів
            
            console.log(`🎉 Update completed! Successfully updated: ${totalUpdated}, Failed: ${totalFailed}`)
            
        } catch (error) {
            console.error('Error in updateAllParsers:', error)
            
            setUpdateResults(prev => ({
                ...prev,
                inProgress: false,
                endTime: new Date()
            }))
            
            setUpdatingAll(false)
        }
    }

    const formatWebsite = (website) => {
        if (!website) return 'No website'
        if (website.length > 30) {
            return website.substring(0, 27) + '...'
        }
        return website
    }

    const formatTime = (date) => {
        if (!date) return 'N/A'
        return date.toLocaleTimeString()
    }

    const getDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return 'N/A'
        const diff = (endTime || new Date()) - startTime
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        return `${minutes}m ${seconds}s`
    }

    if (loading) {
        return (
            <div className="MainRoasterBeanFetch-loading">
                <div className="MainRoasterBeanFetch-spinner"></div>
                <div className="MainRoasterBeanFetch-loading-text">Loading data...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="MainRoasterBeanFetch-error">
                <div className="MainRoasterBeanFetch-error-icon">!</div>
                <div className="MainRoasterBeanFetch-error-text">{error}</div>
                <button 
                    className="MainRoasterBeanFetch-retry-btn"
                    onClick={() => window.location.reload()}
                >
                    Try again
                </button>
            </div>
        )
    }

    const back = () => {
        setShowAddNew(false)
        fetchData()
    }

    if (parserData.length === 0 || showAddNew) {
        return <BeanFetch fetchDataParser={fetchData} onBackToList={back} />
    }

    return (
        <div className="MainRoasterBeanFetch-container">
            <div className="MainRoasterBeanFetch-header">
                <h1 className="MainRoasterBeanFetch-title">Parsers List</h1>
                <div className="MainRoasterBeanFetch-header-actions">
                    {(updateResults.inProgress || updateResults.results.length > 0) && (
                        <button 
                            onClick={() => setShowResultsModal(true)}
                            className="MainRoasterBeanFetch-view-results-btn"
                            title="View update progress and results"
                        >
                            {updateResults.inProgress ? (
                                <>
                                    <span className="MainRoasterBeanFetch-pulse"></span>
                                    📊 View Live Update
                                </>
                            ) : (
                                '📊 View Update Results'
                            )}
                        </button>
                    )}
                    <button 
                        onClick={handleUpdateAllData}
                        disabled={updatingAll || updateResults.inProgress}
                        className={`MainRoasterBeanFetch-update-all-btn ${updatingAll ? 'MainRoasterBeanFetch-loading' : ''}`}
                    >
                        {updateResults.inProgress ? '🔄 Updating...' : '🔄 Update All Data'}
                    </button>
                    <button 
                        onClick={() => setShowAddNew(true)}
                        className="MainRoasterBeanFetch-add-btn"
                    >
                        ➕ Add New Parser
                    </button>
                </div>
            </div>

            <div className="MainRoasterBeanFetch-search-container">
                <input
                    type="text"
                    placeholder="Search by roaster name, ID or website..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="MainRoasterBeanFetch-search-input"
                />
                <div className="MainRoasterBeanFetch-search-count">
                    Found: {filteredData.length} parser{filteredData.length !== 1 ? 's' : ''}
                </div>
            </div>
            
            <div className="MainRoasterBeanFetch-list">
                {filteredData.length === 0 ? (
                    <div className="MainRoasterBeanFetch-no-results">
                        No parsers found for "{searchTerm}"
                    </div>
                ) : (
                    filteredData.map((item) => (
                        <div key={item.id} className="MainRoasterBeanFetch-item-container">
                            <Link 
                                to={`/bean-fetch/${item.id}`}
                                className="MainRoasterBeanFetch-item"
                            >
                                <div className="MainRoasterBeanFetch-item-content">
                                    <div className="MainRoasterBeanFetch-item-name">
                                        {item.roasterName || 'Unnamed Parser'}
                                    </div>
                                    <div className="MainRoasterBeanFetch-item-website">
                                        🌐 {formatWebsite(item.website || item.siteUrl)}
                                    </div>
                                    <div className="MainRoasterBeanFetch-item-id">
                                        ID: {item.id.substring(0, 8)}...
                                    </div>
                                </div>
                                <div className="MainRoasterBeanFetch-item-arrow">
                                    →
                                </div>
                            </Link>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteParser(item.id, item.roasterName || 'Unnamed Parser')
                                }}
                                className="MainRoasterBeanFetch-delete-btn"
                                title="Delete parser"
                            >
                                ✕
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Модальне вікно для результатів */}
            {showResultsModal && (
                <div className="MainRoasterBeanFetch-results-modal">
                    <div className="MainRoasterBeanFetch-results-modal-content">
                        <div className="MainRoasterBeanFetch-results-modal-header">
                            <h2>
                                {updateResults.inProgress ? 'Live Update Progress' : 'Update Results'}
                            </h2>
                            <div className="MainRoasterBeanFetch-results-summary">
                                <div className="MainRoasterBeanFetch-progress-stats">
                                    <span className="MainRoasterBeanFetch-progress-stat">
                                        📊 Total: {updateResults.totalParsers}
                                    </span>
                                    <span className="MainRoasterBeanFetch-progress-stat">
                                        ✅ Done: {updateResults.completedParsers}
                                    </span>
                                    <span className="MainRoasterBeanFetch-progress-stat">
                                        ❌ Failed: {updateResults.failedParsers}
                                    </span>
                                    <span className="MainRoasterBeanFetch-progress-stat">
                                        ⏰ {getDuration(updateResults.startTime, updateResults.endTime)}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowResultsModal(false)}
                                className="MainRoasterBeanFetch-results-modal-close"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="MainRoasterBeanFetch-results-content">
                            {updateResults.inProgress && (
                                <div className="MainRoasterBeanFetch-progress-bar-container">
                                    <div className="MainRoasterBeanFetch-progress-bar">
                                        <div 
                                            className="MainRoasterBeanFetch-progress-fill"
                                            style={{
                                                width: `${(updateResults.completedParsers / updateResults.totalParsers) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                    <div className="MainRoasterBeanFetch-progress-text">
                                        {Math.round((updateResults.completedParsers / updateResults.totalParsers) * 100)}%
                                        ({updateResults.completedParsers}/{updateResults.totalParsers})
                                    </div>
                                </div>
                            )}
                            
                            <div className="MainRoasterBeanFetch-results-table">
                                <div className="MainRoasterBeanFetch-results-table-header">
                                    <div className="MainRoasterBeanFetch-results-table-col">Roaster</div>
                                    <div className="MainRoasterBeanFetch-results-table-col">Status</div>
                                    <div className="MainRoasterBeanFetch-results-table-col">Added</div>
                                    <div className="MainRoasterBeanFetch-results-table-col">Updated</div>
                                    <div className="MainRoasterBeanFetch-results-table-col">Skipped</div>
                                    <div className="MainRoasterBeanFetch-results-table-col">Removed Fields</div>
                                    <div className="MainRoasterBeanFetch-results-table-col">Total</div>
                                </div>
                                
                                <div className="MainRoasterBeanFetch-results-table-body">
                                    {updateResults.results.map((result, index) => (
                                        <div key={index} className={`MainRoasterBeanFetch-results-table-row ${result.status}`}>
                                            <div className="MainRoasterBeanFetch-results-table-col">
                                                {result.roasterName}
                                                {result.currentAction && (
                                                    <div className="MainRoasterBeanFetch-current-action">
                                                        {result.currentAction}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="MainRoasterBeanFetch-results-table-col">
                                                {result.status === 'in_progress' ? (
                                                    <span className="MainRoasterBeanFetch-status-badge in-progress">
                                                        <span className="MainRoasterBeanFetch-spinner-small"></span>
                                                        In Progress
                                                    </span>
                                                ) : result.status === 'success' ? (
                                                    <span className="MainRoasterBeanFetch-status-badge success">
                                                        ✅ Success
                                                    </span>
                                                ) : (
                                                    <span className="MainRoasterBeanFetch-status-badge failed">
                                                        ❌ Failed
                                                    </span>
                                                )}
                                            </div>
                                            <div className="MainRoasterBeanFetch-results-table-col">
                                                {result.status === 'in_progress' ? '-' : result.added}
                                            </div>
                                            <div className="MainRoasterBeanFetch-results-table-col">
                                                {result.status === 'in_progress' ? '-' : result.updated}
                                            </div>
                                            <div className="MainRoasterBeanFetch-results-table-col">
                                                {result.status === 'in_progress' ? '-' : result.skipped}
                                            </div>
                                            <div className="MainRoasterBeanFetch-results-table-col">
                                                {result.status === 'in_progress' ? '-' : result.removedFields}
                                            </div>
                                            <div className="MainRoasterBeanFetch-results-table-col">
                                                {result.status === 'in_progress' ? '-' : result.totalProducts}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {!updateResults.inProgress && updateResults.results.length > 0 && (
                                <div className="MainRoasterBeanFetch-totals">
                                    <div className="MainRoasterBeanFetch-total-item">
                                        <span className="MainRoasterBeanFetch-total-label">Total Added:</span>
                                        <span className="MainRoasterBeanFetch-total-value">
                                            {updateResults.results
                                                .filter(r => r.status === 'success')
                                                .reduce((sum, r) => sum + r.added, 0)}
                                        </span>
                                    </div>
                                    <div className="MainRoasterBeanFetch-total-item">
                                        <span className="MainRoasterBeanFetch-total-label">Total Updated:</span>
                                        <span className="MainRoasterBeanFetch-total-value">
                                            {updateResults.results
                                                .filter(r => r.status === 'success')
                                                .reduce((sum, r) => sum + r.updated, 0)}
                                        </span>
                                    </div>
                                    <div className="MainRoasterBeanFetch-total-item">
                                        <span className="MainRoasterBeanFetch-total-label">Total Removed Fields:</span>
                                        <span className="MainRoasterBeanFetch-total-value">
                                            {updateResults.results
                                                .filter(r => r.status === 'success')
                                                .reduce((sum, r) => sum + r.removedFields, 0)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="MainRoasterBeanFetch-results-modal-footer">
                            <button 
                                onClick={() => setShowResultsModal(false)}
                                className="MainRoasterBeanFetch-results-modal-close-btn"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MainRoasterBeanFetch