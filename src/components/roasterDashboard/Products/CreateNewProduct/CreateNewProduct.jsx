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
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../../firebase'; // переконайся, що імпортуєш firebase storage
import { doc, setDoc } from 'firebase/firestore';


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



  const [website, setWebsite] = useState("");
const [errorLink, setErrorLink] = useState("");

// Функція
const handleWebsiteChange = (e) => {
  const value = e.target.value;
  setWebsite(value);

 if (value && !value.startsWith("https://")) {
  setErrorLink("URL must start with https://");
} else {
  setErrorLink("");
}

};

  const [AddLoading, setAddLoading] = useState(false)

  const notifySuccess = (message) => toast.success(message);
  const notifyError = (message) => toast.error(message);

  const [uploadError, setUploadError] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
  
    if (droppedFile) {
      const fileExtension = droppedFile.name.toLowerCase().split('.').pop();
      if (supportedExtensions.includes(fileExtension)) {
        setImageFile(URL.createObjectURL(droppedFile));
        setImageFileObject(droppedFile);
        setUploadError(null);
      } else {
        setUploadError('Extension not supported');
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
        setUploadError(null);
      } else {
        setUploadError('Extension not supported');
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
    setFormData({
      grind: 'Filter',
      package: '-',
      price: null,
      size: null,
    });
    setActiveModal(false);
  };

  const handleToggle = () => {
    setActiveModal(prev => !prev);
    if (activeModal) {
      setFormData({
        grind: 'Filter',  
        package: '-',
        price: null,
        size: null,
      });
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



const handleAddProduct = async () => {
  setAddLoading(true);
  try {

if (website.trim() && errorLink) {
  setAddLoading(false);
  return;
}


    if (!roasterData?.id) {
      notifyError("No roaster ID found");
      setAddLoading(false);
      return;
    }

    const selectedBean = beans.find(be => be.id === selectedBeanId);
    if (!selectedBean) {
      notifyError("No bean selected");
      setAddLoading(false);
      return;
    }

    if (!prices || prices.length === 0) {
      notifyError("Please add at least one price variant");
      setAddLoading(false);
      return;
    }

    if (!imageFileObject) {
      notifyError("Please upload a product image");
      setAddLoading(false);
      return;
    }

    const productId = uuidv4();
    const { id: beanId, ...beanDataWithoutId } = selectedBean;

    const imageRef = ref(storage, `products/${productId}/productImage.jpg`);
    await uploadBytes(imageRef, imageFileObject);
    const imageUrl = await getDownloadURL(imageRef);

    // Формування об'єкта продукту
    const productData = {
      id: productId,
      beansId: beanId,
      ...beanDataWithoutId,
      prices,
      pack_image_url: imageUrl,
      roastery_id: roasterData.id,
      createdAt: Date.now(),
    };

    console.log('lox' + productId)
    // Якщо поле website заповнене — додаємо
    if (website.trim()) {
      productData.shop = website.trim();
    }

    const docRef = doc(db, 'roasters', roasterData.id, 'products', productId);
    await setDoc(docRef, productData);

    notifySuccess("Product successfully added!");

    // Скидання стейтів
    setPrices([]);
    setImageFile(null);
    setImageFileObject(null);
    setSelectedBeanId(null);
    setWebsite(""); // обнуляємо сайт теж
    setErrorLink("");
  } catch (error) {
    console.error("Error adding product:", error);
    notifyError("Error adding product");
  } finally {
    setAddLoading(false);
  }
};


console.log(website)


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
  <select
    value={formData.size || ''}
    onChange={e => setFormData({ ...formData, size: Number(e.target.value) })}
    required
    className="CreateProduct-select"
  >
    <option disabled value="">Select size</option>
    <option value={250}>250 g</option>
    <option value={500}>500 g</option>
    <option value={1000}>1 kg</option>
  </select>
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
            
            {imageFile && <img src={imageFile} alt="Uploaded Preview" className="beans-preview-image-ultimate" />}
        {!imageFile && !uploadError && (
  <p className="beans-upload-prompt">Drag and drop a file or select it via the button</p>
)}
          </div>

          {uploadError && (
  <p className="beans-upload-error">{uploadError}</p>
)}

               <div className="add-new-roaster-form-section">
      <label htmlFor="website" className="add-new-roaster-form-label">Website</label>
      <input
        id="website"
        value={website}
        onChange={handleWebsiteChange}
        placeholder="Enter website URL"
        className={`add-new-roaster-form-input-website ${error ? "input-error" : ""}`}
      />
      {errorLink && <p className="form-error-message">{errorLink}</p>}
    </div>

          {imageFile && prices.length > 0 && (
  <div className="AddProduct-btnWrapper visible">
    <button disabled={AddLoading} onClick={handleAddProduct} className="AddProduct-btnSave">{AddLoading ? 'Loading' : 'Add Product'}</button>
  </div>
)}


        </>
      )}

      <ToastContainer />
    </div>
  );
};

export default CreateNewProduct;
