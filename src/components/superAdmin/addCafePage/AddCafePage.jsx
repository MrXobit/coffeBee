import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AddCafePage.css';
import Loader from '../../loader/Loader';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { db } from '../../../firebase';
import { collection, doc, getCountFromServer, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

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

  // const firstElemToLoad = 6100;
  // const lastElemToLoad = 25000

    const firstElemToLoad = 0;
  const lastElemToLoad = 100000
  // 2158



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

      await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/uploadImage',
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
  
    const cafeArray = [];
    const failedUrlsArray = [];
    const failedCafes = [];
  

    try {
      for (let i = 0; i < txtLines.length; i++) {
        const url = txtLines[i];
        const found = cafeNameLinks.find(item => item.link === url);
        console.log('index' + i)

        if (found) {
          const normalizedName = found.name
          console.log(found.name)
          // Запит до Firestore за ім'ям
          const cafeByNameQuery = query(
            collection(db, 'cafe'),
            where('name', '==', normalizedName)
          );
          const nameSnapshot = await getDocs(cafeByNameQuery);
      
          if (!nameSnapshot.empty) {
            nameSnapshot.forEach(docSnap => {
              const existingCafe = docSnap.data();
              setExistsCafe(prev => [...prev, existingCafe]);
              notifyError(`This cafe already exists (by name): ${existingCafe.name}`);
              console.log('без запиту до гугл апі (дублікати по імені)');
            });
            continue; // Переходимо до наступного URL, не робимо запит до API
          }
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
  'Portugal',
  'Spain',
  'Netherlands',
  'Belgium',
  'Denmark',
  'Luxembourg',
  'Norway',
  'Sweden',
  'Finland',
];

const handleTxtFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setFileName(file.name);
  const fileExtension = file.name.toLowerCase().split('.').pop();

  const reader = new FileReader();

  reader.onload = (event) => {
    const text = event.target.result;
    let links = [];

    // Функція для вилучення країни з адреси
    const extractCountryFromAddress = (address) => {
      const parts = address.split(',').map(p => p.trim());
      if (parts.length === 0) return null;
      // беремо останню частину адреси
      return parts[parts.length - 1].toLowerCase();
    };

    if (fileExtension === 'csv') {
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      const startLine = lines[0].includes('"id"|||"name"') ? 1 : 0;

      for (let i = startLine; i < lines.length; i++) {
        const parts = lines[i].split('|||');
        if (parts.length > 3) {
          const addressRaw = parts[2].trim().replace(/(^"|"$)/g, '');
          const link = parts[3].trim().replace(/(^"|"$)/g, '');
          const name = parts[1].trim().replace(/(^"|"$)/g, '');

          const countryInAddress = extractCountryFromAddress(addressRaw);

          // Шукаємо чи є країна у списку allowedCountries
          const country = allowedCountries.find(
            c => c.toLowerCase() === countryInAddress
          );

          if (country && link.trim().toLowerCase().startsWith('http')) {
            links.push({ country, link, name });
          }
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
          if (currentLink) links.push({ country: 'unknown', link: currentLink.trim(), name: 'unknown' });
          currentLink = line.trim();
        } else {
          currentLink += ' ' + line.trim();
        }
      });
      if (currentLink) links.push({ country: 'unknown', link: currentLink.trim(), name: 'unknown' });

    } else {
      setError('Extension not supported (only .txt or .csv allowed)');
      setTxtLines([]);
      return;
    }

    // Перевірка на наявність "Combi Coffee Roasters"
    const foundCombi = links.some(item => item.name === 'Combi Coffee Roasters');
    if (foundCombi) {
      console.log('Знайдено кафе "Combi Coffee Roasters" у файлі');
    } else {
      console.log('Кафе "Combi Coffee Roasters" не знайдено у файлі');
    }

    // Обрізка діапазону
    const slicedLinks = links.slice(firstElemToLoad, lastElemToLoad);
    console.log('Загальна кількість посилань:', links.length);

    // Записуємо у стан лише посилання (як раніше)
    setTxtLines(slicedLinks.map(item => item.link));

    // Записуємо у стан об'єкти {name, link}
    setCafeNameLinks(slicedLinks.map(({ name, link }) => ({ name, link })));

    setError(null);
  };

  reader.readAsText(file);
};







  const handleTxtDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    setFileName(droppedFile.name);
    const fileExtension = droppedFile.name.toLowerCase().split('.').pop();

    if (fileExtension === 'txt') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const lines = text
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line !== '');

        const links = [];
        let currentLink = '';

        lines.forEach(line => {
          if (line.includes('https://')) {
            if (currentLink) links.push(currentLink.trim());
            currentLink = line.trim();
          } else {
            currentLink += ' ' + line.trim();
          }
        });

        if (currentLink) links.push(currentLink.trim());
        setTxtLines(links);
        console.log('Links:', links);
      };
      reader.readAsText(droppedFile);
      setError(null);
    } else if (fileExtension === 'csv') {
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    const lines = text.split('\n');
    const links = [];

    for (let i = firstElemToLoad; i < lastElemToLoad && i < lines.length; i++) {
      const parts = lines[i].split('|||');
      const link = parts[parts.length - 1].trim();
      if (link.startsWith('http')) {
        links.push(link);
      }
    }
    setTxtLines(links);
    console.log('Links:', links);
    setError(null);
  };
  reader.readAsText(droppedFile);
}
 else {
      setError('Extension not supported (only .txt or .csv allowed)');
      setTxtLines([]);
    }
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
          {!txtLines.length && !error && <p className="beans-upload-prompt">Drag and drop a .txt, scv file or select it via the button</p>}
          {error && <p className="error-message">{error}</p>}

          {fileName && (
            <button disabled={loadingBtn} className='Add-Coffesby-txt-file' onClick={handleAddCoffes}>
              {loadingBtn ? 'loading...' : 'Add Coffes by txt file'}
            </button>
          )}
        </div>
      </div>

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
