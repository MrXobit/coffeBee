import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../../../../firebase'
import './RoasterSelector.css'

const RoasterSelector = ({ isOpen, onClose, onRoasterSelect }) => {
  const [roasters, setRoasters] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Завантаження ростерів з Firebase
  useEffect(() => {
    if (isOpen) {
      fetchRoasters()
    }
  }, [isOpen])

  const fetchRoasters = async () => {
  try {
    setLoading(true)
    console.log('🌐 Fetching roasters from Firebase...')

    // Отримуємо всіх ростерів з колекції roasters
    const roastersRef = collection(db, 'roasters')
    const roastersSnapshot = await getDocs(roastersRef)

    // Отримуємо всі записи з колекції parser для перевірки
    const parserRef = collection(db, 'parser')
    const parserSnapshot = await getDocs(parserRef)
    
    // Створюємо Set для швидкого пошуку імен ростерів з parser
    const parserRoasterNames = new Set()
    parserSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.roasterName && data.roasterName.trim() !== '') {
        parserRoasterNames.add(data.roasterName.trim().toLowerCase())
      }
    })

    console.log('📊 Found in parser collection:', Array.from(parserRoasterNames))

    const roastersData = []
    roastersSnapshot.forEach((doc) => {
      const data = doc.data()
      const roasterName = data.name || 'No Name'
      
      // Перевіряємо, чи є ця ростерія в колекції parser
      const existsInParser = parserRoasterNames.has(roasterName.trim().toLowerCase())
      
      if (!existsInParser) {
        roastersData.push({
          id: doc.id,
          name: roasterName,
          website: data.website || 'No website',
          shop: data.shop || ''
        })
      } else {
        console.log(`⏭️ Skipping roaster "${roasterName}" - already exists in parser collection`)
      }
    })

    roastersData.sort((a, b) => a.name.localeCompare(b.name))

    console.log('✅ Filtered roasters fetched from Firebase:', roastersData)
    setRoasters(roastersData)
  } catch (err) {
    console.error('❌ Error fetching roasters from Firebase:', err)
  } finally {
    setLoading(false)
  }
}

  // Фільтрація ростерів по імені та сайту
  const filteredRoasters = roasters.filter(roaster =>
    roaster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roaster.website.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRoasterClick = (roaster) => {
    onRoasterSelect(roaster)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="roaster-selector-overlay">
      <div className="roaster-selector-modal">
        <div className="roaster-selector-header">
          <h2>Select Roaster</h2>
          <button onClick={onClose} className="roaster-selector-close">
            ×
          </button>
        </div>

        <div className="roaster-selector-search">
          <input
            type="text"
            placeholder="Search by name or website..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="roaster-selector-input"
          />
        </div>

        <div className="roaster-selector-content">
          {loading ? (
            <div className="roaster-selector-loading">
              <div className="roaster-selector-spinner"></div>
              Loading roasters from database...
            </div>
          ) : filteredRoasters.length === 0 ? (
            <div className="roaster-selector-empty">
              {roasters.length === 0 ? 'No roasters found in database' : 'No roasters match your search'}
            </div>
          ) : (
            <div className="roaster-selector-list">
              {filteredRoasters.map((roaster) => (
                <div
                  key={roaster.id}
                  className="roaster-selector-card"
                  onClick={() => handleRoasterClick(roaster)}
                >
                  <div className="roaster-selector-card-content">
                    <h3 className="roaster-selector-name">{roaster.name}</h3>
                    <p className={`roaster-selector-website ${roaster.website === 'No website' ? 'no-website' : ''}`}>
                      {roaster.website}
                    </p>
                    <div className="roaster-selector-id">ID: {roaster.id}</div>
                  </div>
                  <div className="roaster-selector-arrow">→</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="roaster-selector-footer">
          <button onClick={onClose} className="roaster-selector-cancel">
            Cancel
          </button>
          <div className="roaster-selector-count">
            {filteredRoasters.length} of {roasters.length} roasters
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoasterSelector