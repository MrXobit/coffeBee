import React, { useEffect, useState } from 'react'
import { db } from '../../../../firebase'
import { doc, getDoc } from 'firebase/firestore'
import Loader from '../../../loader/Loader'
import noImage from '../../../../assets/noImage.jpeg'
import back from '../../../../assets/back.png'

const MargeRoasterDetails = ({ roasters, handleCloseItem }) => {
  const [loading, setLoading] = useState(false)
  const [recordsData, setRecordsData] = useState([])

  const getCafe = async () => {
    setLoading(true)
    const results = []

    try {
      for (let i = 0; i < roasters.records.length; i++) {
        const record = roasters.records[i]
        const cafeId = record.cafeId

        // === CASE 1: defaultCafe ===
        if (cafeId === 'defaultCafe') {
          results.push({
            ...record,
            cafe: 'defaultCafe',
          })
          continue
        }

        // === CASE 2: exists in "cafe" ===
        const cafeRef = doc(db, 'cafe', cafeId)
        const cafeSnap = await getDoc(cafeRef)

        if (cafeSnap.exists()) {
          results.push({
            ...record,
            cafe: cafeSnap.data(),
            cafeFromModeration: false,
          })
          continue
        }

        // === CASE 3: not in "cafe", but exists in "moderationCafe" ===
        const modCafeRef = doc(db, 'moderationCafe', cafeId)
        const modCafeSnap = await getDoc(modCafeRef)

        if (modCafeSnap.exists()) {
          results.push({
            ...record,
            cafe: modCafeSnap.data(),
            cafeFromModeration: true,
          })
          continue
        }

        // === CASE 4: no data at all ===
        results.push({
          ...record,
          cafe: 'noData',
        })
      }

      setRecordsData(results)
    } catch (e) {
      console.error('Error in getCafe:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getCafe()
  }, [])

  const formatDate = (dateValue) => {
    if (!dateValue) return ''
    let date
    try {
      if (dateValue?.seconds) {
        date = new Date(dateValue.seconds * 1000)
      } else if (typeof dateValue === 'number') {
        date = dateValue < 1e12 ? new Date(dateValue * 1000) : new Date(dateValue)
      } else if (typeof dateValue === 'string') {
        let cleanString = dateValue.split('.')[0].replace(' ', 'T')
        date = isNaN(new Date(cleanString).getTime()) ? new Date(dateValue) : new Date(cleanString)
      } else if (dateValue instanceof Date) {
        date = dateValue
      } else {
        date = new Date(dateValue)
      }
      if (isNaN(date.getTime())) return String(dateValue)
      return date.toLocaleString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return String(dateValue)
    }
  }

  return (
    <div className="MargeRoasterDetails-con">
      <img
        onClick={handleCloseItem}
        src={back}
        className="MargeRoasterDetails-backImg"
        alt="Back"
      />
      <h1 className="MargeRoasterDetails-title">Records Details</h1>

      {loading ? (
        <div className="MargeRoasterDetails-loaderCenter">
          <Loader />
        </div>
      ) : recordsData.length === 0 ? (
        <div className="MargeRoasterDetails-empty">
          <div className="MargeRoasterDetails-emptyCircle">☕</div>
          <h2 className="MargeRoasterDetails-emptyTitle">Nothing to brew yet</h2>
          <p className="MargeRoasterDetails-emptySubtitle">
            This roaster hasn’t shared any records.<br />
            Come back later for a fresh cup of updates!
          </p>
        </div>
      ) : (
        <div className="MargeRoasterDetails-list">
          {recordsData.map((record, index) => {
            let cafeStatus = 'No data'
            if (record.cafe === 'defaultCafe') cafeStatus = 'From Home'
            else if (record.cafeFromModeration === true) cafeStatus = 'From Moderation'
            else if (record.cafeFromModeration === false) cafeStatus = 'Verified Cafe'

            return (
              <div key={index} className="MargeRoasterDetails-recordBlock">
                <div className="MargeRoasterDetails-recordHeader">
                  <p className="MargeRoasterDetails-recordText">
                    Country: {record.countryId || 'Not specified'}
                  </p>
                  <p className="MargeRoasterDetails-recordText">
                    Time: {formatDate(record.date)}
                  </p>
                </div>

                <div className="MargeRoasterDetails-logoBlock">
                  {record.logo ? (
                    <img
                      src={record.logo}
                      alt="Record Logo"
                      className="MargeRoasterDetails-logo"
                    />
                  ) : (
                    <p className="MargeRoasterDetails-noLogo">No logo</p>
                  )}
                </div>

                <div className="MargeRoasterDetails-cafeBlock">
                  <h3 className="MargeRoasterDetails-cafeTitle">Cafe</h3>
                  <p className="MargeRoasterDetails-cafeStatus">Status: {cafeStatus}</p>

                  {record.cafe && record.cafe !== 'defaultCafe' && record.cafe !== 'noData' ? (
                    <div className="MargeRoasterDetails-cafeInfo">
                      <img
                        src={
                          record.cafe?.adminData?.photos &&
                          Object.values(record.cafe.adminData.photos).length > 0
                            ? Object.values(record.cafe.adminData.photos)[0]
                            : noImage
                        }
                        alt="Cafe"
                        className="MargeRoasterDetails-cafeImg"
                      />
                      <div className="MargeRoasterDetails-cafeText">
                        <p className="MargeRoasterDetails-cafeName">{record.cafe.name}</p>
                        <p className="MargeRoasterDetails-cafeDescription">
                          {record.cafe.vicinity}, {record.cafe.city}, {record.cafe.country}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="MargeRoasterDetails-cafeNoData">No cafe data available</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MargeRoasterDetails
