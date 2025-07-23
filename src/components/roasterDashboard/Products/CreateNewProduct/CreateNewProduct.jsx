import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase';
import Loader from '../../../loader/Loader';
import './CreateNewProduct.css';
import plus from '../../../../assets/pngPLUSSS.png';
import close from '../../../../assets/closeIcon.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CreateNewProduct = () => {
  const { roasterData } = useSelector(state => state.roaster);
  const [beans, setBeans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBeanId, setSelectedBeanId] = useState(null);
  const [prices, setPrices] = useState([]);
  const [activeModal, setActiveModal] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageFileObject, setImageFileObject] = useState(null);
  const supportedExtensions = ['jpg', 'jpeg', 'png'];
  const [formData, setFormData] = useState({
    grind: 'Filter',  // <-- дефолтне значення
    package: '-',
    price: null,
    size: null,
  });

  const notifySuccess = (message) => toast.success(message);
  const notifyError = (message) => toast.error(message);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];

    if (droppedFile) {
      const fileExtension = droppedFile.name.toLowerCase().split('.').pop();
      if (supportedExtensions.includes(fileExtension)) {
        setImageFile(URL.createObjectURL(droppedFile));
        setImageFileObject(droppedFile);
        setError(null);
      } else {
        setError('Extension not supported');
        setImageFile(null);
        setImageFileObject(null);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      if (supportedExtensions.includes(fileExtension)) {
        setImageFile(URL.createObjectURL(file));
        setImageFileObject(file);
        setError(null);
      } else {
        setError('Extension not supported');
        setImageFile(null);
        setImageFileObject(null);
      }
    }
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const fetchBeans = async () => {
    setLoading(true);
    setError(null);
    try {
      const beansRef = collection(db, 'beans');
      const q = query(beansRef, where('roaster', '==', roasterData.id));
      const querySnapshot = await getDocs(q);
      const beansList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBeans(beansList);
    } catch (err) {
      console.error('Error fetching beans:', err);
      setError('Failed to load beans.');
    } finally {
      setLoading(false);
    }
  };

  const chandleAddPrices = () => {
    if (!formData.grind || formData.price === null || formData.size === null) {
      notifyError('Please fill in all fields');
      return;
    }

    setPrices(prev => [...prev, { ...formData }]);
    setFormData({ grind: null, package: '-', price: null, size: null });
    setActiveModal(false);
  };

  const handleToggle = () => {
    setActiveModal(prev => !prev);
    if (activeModal) {
      setFormData({ grind: null, package: '-', price: null, size: null });
    }
  };

  useEffect(() => {
    if (roasterData?.id) {
      fetchBeans();
    }

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
  }, [roasterData?.id]);

  if (loading) return  <div className='OllBeansRo-center-loader'><Loader /></div>;
  if (error) return <p className="CreateProduct-error">{error}</p>;

  return (
    <div className="CreateProduct-wrapper">
      <h2 className="CreateProduct-title">Create New Product</h2>
      <p className="CreateProduct-subtitle">Select a bean:</p>

      <div className="CreateProduct-beansScrollable">
        <div className="CreateProduct-beansGrid">
          {beans.map(bean => (
            <div
              key={bean.id}
              className={`CreateProduct-beanCard ${selectedBeanId === bean.id ? 'selected' : ''}`}
              onClick={() => setSelectedBeanId(bean.id)}
            >
              {bean.name && <p><strong>Name:</strong> {bean.name}</p>}
              {bean.country && <p><strong>Country:</strong> {bean.country}</p>}
              {bean.process && <p><strong>Process:</strong> {bean.process}</p>}
              {bean.flavoursByRoaster && <p><strong>Flavours:</strong> {bean.flavoursByRoaster}</p>}
              {bean.roasting && <p><strong>Roasting:</strong> {bean.roasting}</p>}
            </div>
          ))}
        </div>
      </div>

      {selectedBeanId && (
        <>
          <div onClick={handleToggle} className="CreateProduct-addPricesBtn">
            <h1 className="CreateProduct-addPricesTitle">add prices</h1>
            <img src={plus} alt="Add" className="CreateProduct-addPricesIcon" />
          </div>

          {prices.length > 0 && (
            <div className="CreateProduct-pricesList">
              <h3 className="CreateProduct-pricesTitle">Added Prices:</h3>
              <ul className="CreateProduct-pricesUl">
                {prices.map((priceItem, index) => (
                  <li key={index} className="CreateProduct-priceItemWrapper">
                    <img
                      src={close}
                      className="CreateProduct-imgPrices"
                      alt="Remove"
                      onClick={() => setPrices(prev => prev.filter((_, i) => i !== index))}
                    />
                    <div className="CreateProduct-priceItem">
                      Grind: {priceItem.grind}, Price: {priceItem.price} {roasterData?.bank_details?.currency}, Size: {priceItem.size}g
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeModal && (
            <div className="CreateProduct-activeModalCon">
              <div className="CreateProduct-modal">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    chandleAddPrices();
                  }}
                  className="CreateProduct-form"
                >
                  <img
                    src={close}
                    alt="Close"
                    className="CreateProduct-modalClose"
                    onClick={() => setActiveModal(false)}
                  />

                  <label className="CreateProduct-label">
                    Grind:
                    <select
                      value={formData.grind || ''}
                      onChange={e => setFormData({ ...formData, grind: e.target.value })}
                      required
                      className="CreateProduct-select"
                    >
                       <option value="Filter">Filter</option>
                      <option value="Espresso">Espresso</option>
                    </select>
                  </label>

                  <label className="CreateProduct-label">
                    Price: {roasterData?.bank_details?.currency}
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="10"
                      required
                      min={0}
                      step={0.01}
                      className="CreateProduct-input"
                    />
                  </label>

                  <label className="CreateProduct-label">
                    Size:
                    <input
                      type="number"
                      value={formData.size || ''}
                      onChange={e => setFormData({ ...formData, size: Number(e.target.value) })}
                      placeholder="250"
                      required
                      min={0}
                      step={1}
                      className="CreateProduct-input"
                    />
                  </label>

                  <button type="submit" className="CreateProduct-saveBtn">
                    Save
                  </button>
                </form>
              </div>
            </div>
          )}

          <div
            className="beans-for-img-con"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <label htmlFor="beans-img-uploader">Image Upload</label>
            <input
              type="file"
              name="imageUrl"
              id="beans-img-uploader"
              className="input-file-upload-ultimate"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imageFile && (
              <img src={imageFile} alt="Uploaded Preview" className="beans-preview-image-ultimate" />
            )}
            {!imageFile && !error && (
              <p className="beans-upload-prompt">Drag and drop a file or select it via the button</p>
            )}
          </div>

          {imageFile && prices.length > 0 && (
  <button className="AddProduct-btnSave">Add Product</button>
)}

        </>
      )}

      <ToastContainer />
    </div>
  );
};

export default CreateNewProduct;
