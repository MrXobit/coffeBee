import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AddCafePage.css';
import Loader from '../../loader/Loader';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { db } from '../../../firebase';
import close from '../../../assets/close.png'
import { collection, doc, getCountFromServer, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

import { motion, AnimatePresence } from 'framer-motion';


const AddCafePage = () => {
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState(null);
  const supportedExtensions = ['txt'];
  const [inputValue, setInputValue] = useState('');
  const [cafeData, setCafeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [imageFileObject, setImageFileObject] = useState(null);
  const notifySuccess = (message) => toast.success(message);
  const notifyError = (message) => toast.error(message);
  const [txtLines, setTxtLines] = useState([]);
  const [fileName, setFileName] = useState('');
  const [cafeDatasByTxt, setCafeDatasByTxt] = useState([]);
  const [faildUrls, setFailUrls] = useState([]);

  const [loadingFaildUrls, setLoadingFaildUrls] = useState(false)

  const [existCafes, setExistsCafe] = useState([]);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [faildCafesFile, setCafesFailed] = useState([])
 

  const [cafeNameLinks, setCafeNameLinks] = useState([]); 

// 6100
    const firstElemToLoad = 0;
  const lastElemToLoad = 100000
 


const [filter, setFilter] = useState({ countrys: [], active: false });

const [inputCountry, setInputCountry] = useState('')

const [counttyError, setCountryError] = useState('')

const [lastFile, setLastFile] = useState(null);


function FilterBlock({ filter, setFilter }) {
  return (
    <AnimatePresence>
      {filter.active && (
        <motion.div
          className="addCafePage-inputToCountry-wrapper"
          initial={{ opacity: 0, maxHeight: 0, overflow: 'hidden' }}
          animate={{ opacity: 1, maxHeight: 300, overflow: 'visible' }}
          exit={{ opacity: 0, maxHeight: 0, overflow: 'hidden' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          key="filter-block"
        >
          <div className="addCafePage-inputToCountry">
            <h3>Filter by country</h3>
            <div className="addCafePage-inputToCountry-conn">
              <input
                type="text"
                placeholder="e.g. Italy, USA, Japan"
                value={filter.country || ''}
                onChange={e =>
                  setFilter(prev => ({ ...prev, country: e.target.value }))
                }
              />
              <button onClick={() => {/* логіка додавання */}}>Add</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


  const handleGetInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (inputValue.trim() === '') {
        setCafeData(null);
        notifyError('The URL is not valid');
        return;
      }

      const response = await axios.post(
        `https://us-central1-coffee-bee.cloudfunctions.net/getCafeDataByUrl`,
        { url: inputValue }
      );

      setCafeData(response.data);
      console.log(response.data);
    } catch (error) {
      console.log(error.response.data);
      notifyError('Error fetching cafe data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCoffe = async (e) => {
    e.preventDefault();
    setLoadingAdd(true);
    try {
      const cafeDocRef = doc(db, 'cafe', cafeData.place_id);
      const cafeDocSnap = await getDoc(cafeDocRef);

      if (cafeDocSnap.exists()) {
        return notifyError('This cafe already exists');
      }

      const token = localStorage.getItem('token');

    // 'https://us-central1-coffee-bee.cloudfunctions.net/uploadImage',
      await axios.post(
        'http://127.0.0.1:5001/coffee-bee/us-central1/uploadImage',
        { cafeData },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      notifySuccess('Cafe added successfully');
      setCafeData(null);
      setInputValue('');
    } catch (e) {
      console.log(e);
      notifyError('Error adding cafe');
    } finally {
      setLoadingAdd(false);
    }
  };








  

  const handleAddCoffes = async () => {
    setExistsCafe([]);
    setFailUrls([]);
    setLoadingBtn(true);
    


  if (filter.active && (!filter.countrys || filter.countrys.length === 0)) {
    setCountryError('Please select at least one country for filtering');
   setLoadingBtn(false);
    return; // не обробляємо файл без вибраної країни
  }else {
    setCountryError('')
  }



    const cafeArray = [];
    const failedUrlsArray = [];
    const failedCafes = [];
  

    try {
 // Функція перевірки близькості координат
const areCoordsClose = (lat1, lng1, lat2, lng2, epsilon = 0.0005) => {
  return (
    Math.abs(Number(lat1) - Number(lat2)) < epsilon &&
    Math.abs(Number(lng1) - Number(lng2)) < epsilon
  );
};

// Функція перевірки, чи одна назва "дуже схожа" на іншу
const areNamesSimilar = (name1, name2) => {
  const n1 = name1.toLowerCase();
  const n2 = name2.toLowerCase();
  return n1.includes(n2) || n2.includes(n1);
};
for (let i = 0; i < txtLines.length; i++) {
  const url = txtLines[i];
  const found = cafeNameLinks.find(item => item.link === url);
  console.log('index', i);

  if (!found) continue;

  const { name, lat, lng } = found;

  // Запит до Firestore по імені (можна шукати приблизно, але поки що exact)
  const cafeByNameQuery = query(
    collection(db, 'cafe'),
    where('name', '==', name)  // можна замінити, якщо хочеш більш гнучкий пошук
  );
  const snapshot = await getDocs(cafeByNameQuery);

  let duplicateFound = false;

  if (!snapshot.empty) {
    snapshot.forEach(docSnap => {
      const existingCafe = docSnap.data();
      const geo = existingCafe.geometry?.location;

      // Перевірка одночасно і на схожість імені, і близькість координат
      if (geo && areCoordsClose(geo.lat, geo.lng, lat, lng) && areNamesSimilar(existingCafe.name, name)) {
        setExistsCafe(prev => [...prev, existingCafe]);
        notifyError(`This cafe already exists (similar name & close coords): ${existingCafe.name}`);
        console.log('Duplicate found by similar name & close coords:', existingCafe.name);
        duplicateFound = true;
      }
    });
  }

  if (duplicateFound) {
    console.log(`Skipping API call for index ${i} because duplicate found.`);
    continue;
  }

  
      
        


      console.log('з запиту до гугл апі')
        try {
          const response = await axios.post(
            'https://us-central1-coffee-bee.cloudfunctions.net/getCafeDataByUrl',
            { url }
          );
  
          const cafeData = response.data;
  
          if (cafeData && cafeData.name) {
            try {
              const cafeDocRef = doc(db, 'cafe', cafeData.place_id);
              const cafeDocSnap = await getDoc(cafeDocRef);
  
              if (cafeDocSnap.exists()) {
                setExistsCafe((prev) => [...prev, cafeData]);
                notifyError(`This cafe already exists: ${cafeData.name}`);
                continue;
              }
  
              const token = localStorage.getItem('token');
  
              await axios.post(
                'https://us-central1-coffee-bee.cloudfunctions.net/uploadImage',
                { cafeData },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
  
              notifySuccess(`Cafe added successfully: ${cafeData.name}`);
            } catch (err) {
              console.error(`Error adding cafe "${cafeData.name}" at index ${i}:`, err);
              failedCafes.push(cafeData);
            }
  
            cafeArray.push(cafeData);
          } else {
            failedUrlsArray.push(url);
          }
        } catch (error) {
          console.error(`Failed to fetch cafe data from URL: ${url}`, error);
          failedUrlsArray.push(url);
        }
      }
  
      setCafeDatasByTxt(cafeArray);
      setFailUrls(failedUrlsArray);
      setCafesFailed(failedCafes);
      setTxtLines([]);
      setFileName('');
    } catch (e) {
      console.error('Unexpected error during the process: ', e);
    } finally {
      setLoadingBtn(false);
    }
  };
  

const secondAdd = async () => {
  if (!Array.isArray(faildCafesFile) || faildCafesFile.length === 0) {
    return notifyError('Список невдалих кафе порожній');
  }

  try {
    const failedCafes = [];

    for (let i = 0; i < faildCafesFile.length; i++) {
      try {
        const cafeDocRef = doc(db, 'cafe', faildCafesFile[i].place_id);
        const cafeDocSnap = await getDoc(cafeDocRef);

        if (cafeDocSnap.exists()) {
          setExistsCafe((prev) => [...prev, faildCafesFile[i]]);
          notifyError('This cafe already exists');
          continue;
        }

        const token = localStorage.getItem('token');

        await axios.post(
          'https://us-central1-coffee-bee.cloudfunctions.net/uploadImage',
          { cafeData: faildCafesFile[i] },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        notifySuccess('Cafe added successfully');
      } catch (err) {
        console.error(`Error with cafe at index ${i}:`, faildCafesFile[i], err);
        failedCafes.push(faildCafesFile[i]);
      }
    }

    setCafesFailed(failedCafes);
  } catch (e) {
    console.error('Unexpected error during the process: ', e);
    notifyError('An unexpected error occurred');
  }
};





const handleCantFindNestTry = async (faildUrls) => {
  setLoadingFaildUrls(true)
  try {
    const cafeArray = [];
    const failedUrlsArray = [];

    for (let i = 0; i < faildUrls.length; i++) {
      try {
        const response = await axios.post(
          'https://us-central1-coffee-bee.cloudfunctions.net/getCafeDataByUrl',
          { url: faildUrls[i] }
        );

        if (response.data && response.data.name) {
          cafeArray.push(response.data);
        } else {
          failedUrlsArray.push(faildUrls[i]);
        }
      } catch (error) {
        failedUrlsArray.push(faildUrls[i]);
      }
    }

    setCafeDatasByTxt(cafeArray);
    setFailUrls(failedUrlsArray);
    console.log(cafeArray);

    try {
      const failedCafes = [];

      for (let i = 0; i < cafeArray.length; i++) {
        try {
          const cafeDocRef = doc(db, 'cafe', cafeArray[i].place_id);
          const cafeDocSnap = await getDoc(cafeDocRef);

          if (cafeDocSnap.exists()) {
            setExistsCafe((prev) => [...prev, cafeArray[i]]);
            notifyError('This cafe already exists');
            continue;
          }

          const token = localStorage.getItem('token');

          await axios.post(
            'https://us-central1-coffee-bee.cloudfunctions.net/uploadImage',
            { cafeData: cafeArray[i] },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          notifySuccess('Cafe added successfully');
        } catch (err) {
          console.error(`Error with cafe at index ${i}:`, cafeArray[i], err);
          failedCafes.push(cafeArray[i]);
        }
      }
      setCafesFailed(failedCafes);
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  } finally {
     setLoadingFaildUrls(false)
  }
};





const allowedCountries = [
  'Netherlands', // Нидерланды
  'Portugal',    // Португалия
  'Poland',      // Польша
  'Romania',     // Румыния
  'Ukraine',     // Украина
  'Denmark',     // Дания
];


function extractCoordinates(url) {
  const matchD = url.match(/!3d([\d.-]+)!4d([\d.-]+)/);
  if (matchD) return { lat: parseFloat(matchD[1]), lng: parseFloat(matchD[2]) };

  const matchAt = url.match(/@([\d.-]+),([\d.-]+)/);
  if (matchAt) return { lat: parseFloat(matchAt[1]), lng: parseFloat(matchAt[2]) };

  return { lat: null, lng: null };
}

function extractNameFromUrl(url) {
  const match = url.match(/maps\/place\/([^/]+)/);
  if (match) {
    let name = match[1];
    try {
      return decodeURIComponent(decodeURIComponent(name.replace(/\+/g, ' ')));
    } catch (err) {
      console.warn('Decode error in extractNameFromUrl:', err.message);
      return name.replace(/\+/g, ' ');
    }
  }
  return null;
}
function extractCountryFromAddress(address) {
  if (!address) return null;
  const lowerAddress = address.toLowerCase();

  for (const country of filter.countrys) {
    const lowerCountry = country.toLowerCase();
    // Шукаємо країну як слово (з урахуванням пробілів/пунктуації з обох боків)
    const regex = new RegExp(`\\b${lowerCountry}\\b`, 'i');
    if (regex.test(lowerAddress)) {
      return country; // повертаємо оригінальний напис з allowedCountries
    }
  }
  return null;
}

function parseCSVLine(line) {
  // Проста функція для парсингу CSV рядка з лапками
  const regex = /("([^"]|"")*"|[^,]+)(,|$)/g;
  const result = [];
  let match;
  while ((match = regex.exec(line)) !== null) {
    let value = match[1];
    value = value.trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/""/g, '"');
    }
    result.push(value);
  }
  return result;
}


function processFile(file) {
  setFileName(file.name);


    if (!filter.countrys || filter.countrys.length === 0) {
    processFileAll(file);
    return;
  }
  


  const fileExtension = file.name.toLowerCase().split('.').pop();
  const reader = new FileReader();

  reader.onload = (event) => {
    const text = event.target.result;
    let links = [];

    if (fileExtension === 'csv') {
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      const startLine = lines[0].toLowerCase().includes('"id"') ? 1 : 0;

      for (let i = startLine; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        if (parts.length < 4) continue;

        const addressRaw = parts[2];
        const link = parts[3];
        const rawName = parts[1];

        const foundCountry = extractCountryFromAddress(addressRaw);
        const { lat, lng } = extractCoordinates(link);
        const name = extractNameFromUrl(link) || rawName;

        if (foundCountry && link.toLowerCase().startsWith('http')) {
          links.push({ country: foundCountry, link, name, lat, lng });
        }
      }

    } else if (fileExtension === 'txt') {
      const rawLines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line !== '');

      let currentLink = '';
      rawLines.forEach(line => {
        if (line.includes('https://')) {
          if (currentLink) {
            const { lat, lng } = extractCoordinates(currentLink);
            const name = extractNameFromUrl(currentLink) || 'unknown';
            links.push({ country: 'unknown', link: currentLink.trim(), name, lat, lng });
          }
          currentLink = line.trim();
        } else {
          currentLink += ' ' + line.trim();
        }
      });
      if (currentLink) {
        const { lat, lng } = extractCoordinates(currentLink);
        const name = extractNameFromUrl(currentLink) || 'unknown';
        links.push({ country: 'unknown', link: currentLink.trim(), name, lat, lng });
      }

    } else {
      setError('Extension not supported (only .txt or .csv allowed)');
      setTxtLines([]);
      return;
    }

    const foundCombi = links.some(item => item.name === 'Combi Coffee Roasters');
    console.log(foundCombi
      ? 'Знайдено кафе "Combi Coffee Roasters" у файлі'
      : 'Кафе "Combi Coffee Roasters" не знайдено у файлі'
    );

    const slicedLinks = links.slice(firstElemToLoad, lastElemToLoad);
    console.log('Загальна кількість посилань після фільтрації:', links.length);

    setTxtLines(slicedLinks.map(item => item.link));
    setCafeNameLinks(slicedLinks.map(({ name, link, lat, lng }) => ({ name, link, lat, lng })));

    setError(null);
  };

  reader.readAsText(file);
}




function processFileAll(file) {
  setFileName(file.name);
  const fileExtension = file.name.toLowerCase().split('.').pop();
  const reader = new FileReader();

  reader.onload = (event) => {
    const text = event.target.result;
    let links = [];

    if (fileExtension === 'csv') {
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      const startLine = lines[0].toLowerCase().includes('"id"') ? 1 : 0;

      for (let i = startLine; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        if (parts.length < 4) continue;

        // прибираємо лапки й пробіли
        const rawName = parts[1].replace(/^"+|"+$/g, '').trim();
        const addressRaw = parts[2].replace(/^"+|"+$/g, '').trim();
        const link = parts[3].replace(/^"+|"+$/g, '').trim();

        if (!link.toLowerCase().startsWith('http')) continue;

        const { lat, lng } = extractCoordinates(link);
        const name = extractNameFromUrl(link) || rawName || 'unknown';

        links.push({ country: 'unknown', link, name, lat, lng });
      }

    } else if (fileExtension === 'txt') {
      const rawLines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line !== '');

      let currentLink = '';
      rawLines.forEach(line => {
        if (line.includes('https://')) {
          if (currentLink) {
            const { lat, lng } = extractCoordinates(currentLink);
            const name = extractNameFromUrl(currentLink) || 'unknown';
            links.push({ country: 'unknown', link: currentLink.trim(), name, lat, lng });
          }
          currentLink = line.trim();
        } else {
          currentLink += ' ' + line.trim();
        }
      });
      if (currentLink) {
        const { lat, lng } = extractCoordinates(currentLink);
        const name = extractNameFromUrl(currentLink) || 'unknown';
        links.push({ country: 'unknown', link: currentLink.trim(), name, lat, lng });
      }

    } else {
      setError('Extension not supported (only .txt or .csv allowed)');
      setTxtLines([]);
      return;
    }

    const foundCombi = links.some(item => item.name === 'Combi Coffee Roasters');
    console.log(foundCombi
      ? 'Знайдено кафе "Combi Coffee Roasters" у файлі'
      : 'Кафе "Combi Coffee Roasters" не знайдено у файлі'
    );

    const slicedLinks = links.slice(firstElemToLoad, lastElemToLoad);
    console.log('Загальна кількість посилань:', links.length);

    setTxtLines(slicedLinks.map(item => item.link));
    setCafeNameLinks(slicedLinks.map(({ name, link, lat, lng }) => ({ name, link, lat, lng })));

    setError(null);
  };

  reader.readAsText(file);
}


useEffect(() => {
  if (lastFile && filter.active) {
    processFile(lastFile);
  }
}, [filter.countrys]);




const handleAddCountry = () => {
  const trimmed = inputCountry.trim();
  if (trimmed === '') return; // Якщо порожній рядок — нічого не робимо

  if (filter.countrys.includes(trimmed)) {
    alert(`Country "${trimmed}" already added`);
    return;
  }

  setFilter(prev => ({
    ...prev,
    countrys: [...prev.countrys, trimmed],
  }));

  setInputCountry(''); // Очистити інпут після додавання
  setCountryError(''); 



};




const handleTxtFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setLastFile(file);  
  if (filter.active) {
    processFile(file);      // З фільтром
  } else {
    processFileAll(file);   // Без фільтру
  }
};

const handleTxtDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  const droppedFile = e.dataTransfer.files[0];
  if (!droppedFile) return;

  setLastFile(droppedFile); 
  if (filter.active) {
    processFile(droppedFile);     // З фільтром
  } else {
    processFileAll(droppedFile);  // Без фільтру
  }
};


const handleRemoveCountry = (countryToRemove) => {
  setFilter(prev => {
    const updatedCountries = prev.countrys.filter(c => c !== countryToRemove);

    // Після оновлення стану викликаємо обробку файлу
    if (lastFile) {
      processFile(lastFile); // або processFile(lastFile), залежно від твоєї логіки
    }

    return {
      ...prev,
      countrys: updatedCountries,
    };
  });
};



  const handleDragOver = (e) => e.preventDefault();
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); };

  useEffect(() => {
    const preventFileOpen = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', preventFileOpen);
    window.addEventListener('drop', preventFileOpen);

    return () => {
      window.removeEventListener('dragover', preventFileOpen);
      window.removeEventListener('drop', preventFileOpen);
    };
  }, []);

  return (
    <div className="AddCafePage">
      <h1 className="AddCafePage-main-title">Search for a cafe and add it to the database</h1>
      <div className="AddCafePage-btn-input-con">
        <input
          type="text"
          placeholder="Paste link from Google Maps"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="AddCafePage-inputField"
        />
        <button onClick={handleGetInfo} disabled={loading} className="AddCafePage-getInfoBtn">
          {loading ? 'loading...' : 'get info'}
        </button>
      </div>

      <button className='AddCafePag-clearInput' onClick={() => setInputValue('')}>clear input</button>

      {loading ? (
        <div className='AddCafePage-loader-con'>
          <Loader />
        </div>
      ) : (
        <>
          {cafeData && (
            <div className="AddCafePage-cafeInfo">
              <h2>Cafe Information:</h2>
              <div className="AddCafePage-infoItem"><strong>Name:</strong> {cafeData.name}</div>
              <div className="AddCafePage-infoItem"><strong>Address:</strong> {cafeData.formatted_address}</div>
              <div className="AddCafePage-infoItem">
                <strong>Coordinates:</strong>
                <div>Latitude: {cafeData.geometry.location.lat}</div>
                <div>Longitude: {cafeData.geometry.location.lng}</div>
              </div>
              <button onClick={handleAddNewCoffe} disabled={loadingAdd} className='AddCafePage-infoItem-btn-addBd'>
                {loadingAdd ? 'loading' : "Add coffee to the database"}
              </button>
            </div>
          )}
        </>
      )}

      <div className="connnnnnnnn">

  
        <div
          className="beans-for-img-con"
          onDrop={handleTxtDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >

  <p className="addCafePage-lengthCafes">Number of cafes: {txtLines.length}</p>


          <label htmlFor="beans-txt-uploader">Upload TXT/CSV File</label>
          <input
            type="file"
            name="txtFile"
            id="beans-txt-uploader"
            className="input-file-upload-ultimate"
            accept=".txt,.csv"
            onChange={handleTxtFileChange}
          />

          
          {fileName && <p className="uploaded-file-name">Uploaded file: <strong>{fileName}</strong></p>}

{fileName !== '' && 

  <>
<div
  className="addCafePage-randomName"
  onClick={() => {
    setFilter(prev => ({
      ...prev,
      active: !prev.active,
      countrys: prev.active ? [] : prev.countrys, // Якщо active був true, очистити масив країн
    }));
    setCountryError(''); // Очистити помилку при кліку
  }}
>
  {filter.active
    ? `Now adding only cafes from 'selected country' (press to change)`
    : 'Now adding all cafes without filtering (press to change)'}
</div>

      <AnimatePresence>
        {filter.active && (
          <motion.div
            key="filter-block"
            className="addCafePage-inputToCountry-wrapper"
            initial={{ opacity: 0, maxHeight: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, maxHeight: 300, overflow: 'visible' }}
            exit={{ opacity: 0, maxHeight: 0, overflow: 'hidden' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="addCafePage-inputToCountry">
              <h3>Filter by country</h3>
              <div className="addCafePage-inputToCountry-conn">
                <input
                  type="text"
                  placeholder="e.g. Italy, USA, Japan"
                value={inputCountry}
                onChange={e => setInputCountry(e.target.value)}
                />
                <button onClick={handleAddCountry}>
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


  </>

}


          {!txtLines.length && !error && <p className="beans-upload-prompt">Drag and drop a .txt, scv file or select it via the button</p>}
          {error && <p className="error-message">{error}</p>}

          {fileName && (
            <button disabled={loadingBtn} className='Add-Coffesby-txt-file' onClick={handleAddCoffes}>
              {loadingBtn ? 'loading...' : 'Add Coffes by txt file'}
            </button>
          )}
        </div>
      </div>


<h2 className='handle-addCafePage-countyrError'>{counttyError}</h2>


{filter.countrys && filter.countrys.length > 0 && (
  <div className="filterBlock__countriesList filterBlock__countriesList--flexWrap">
    {filter.countrys.map((country, index) => (
      <div key={index} className="filterBlock__countryChip filterBlock__countryChip--styled">
        <span className="filterBlock__countryName filterBlock__countryName--bold">{country}</span>
        <img
  src={close}
  alt="remove"
  className="filterBlock__countryCloseBtn filterBlock__countryCloseBtn--interactive"
   onClick={() => handleRemoveCountry(country)}
/>
      </div>
    ))}
  </div>
)}



      {faildUrls.length > 0 && (
        <div className="AddCafePage-faildUrl">
          {faildUrls.map((fail, index) => (
            <>
            <h1>Cant find data</h1>
            <p key={index} className="AddCafePage-faildUrl-p">{fail}</p>
            </>
          ))}
          <button className='AddCafePage-unglyBtn' disabled={loadingFaildUrls} onClick={() => handleCantFindNestTry(faildUrls)}>
            {loadingFaildUrls ? 'Loading' : 'second try to add'}
            </button>
        </div>
      )}

      {existCafes.length > 0 && (
        <div className="AddCafePage-faildUrl">
          <h1>Café already exists</h1>
          {existCafes.map((fail, index) => (
            <p key={index} className="AddCafePage-faildUrl-p">
              {fail.name} ({fail.formatted_address})
            </p>
          ))}
        </div>
      )}



  {faildCafesFile && faildCafesFile.length > 0 && (
  <>
    <h1 className="AddCafePage-failAddToBd">Не вдалося додати в БД:</h1>
    <ul className="AddCafePage-failAddToBdList">
      {faildCafesFile.map((cafe, index) => (
        <li key={index} className="AddCafePage-failAddToBdItem">
          <a
            href={cafe.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="AddCafePage-failAddToBdLink"
          >
          
            {cafe.name || 'Без назви'}
          </a>
        </li>
      ))}

      <div className='пофанудів'>
  <button className='AddCafePage-try-add-oneMoretime' onClick={secondAdd}>try add again</button>
      </div>
    
    </ul>
    
  </>
)}
   <ToastContainer />


    </div>
  );
};

export default AddCafePage;
