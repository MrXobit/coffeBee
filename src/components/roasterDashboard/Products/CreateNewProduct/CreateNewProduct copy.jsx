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

  const notifySuccess = (message) => toast.success(message);
  const notifyError = (message) => toast.error(message);

  const [prices, setPrices] = useState([]);

  const [activeModal, setActiveModal] = useState(false);

  const [formData, setFormData] = useState({
    grind: null,
    package: '-',
    price: null,
    size: null
  });

  const fetchBeans = async () => {
    setLoading(true);
    setError(null);
    try {
      const beansRef = collection(db, 'beans');
      const q = query(beansRef, where('roaster', '==', roasterData.id));
      const querySnapshot = await getDocs(q);
      const beansList = [];
      querySnapshot.forEach(doc => {
        beansList.push({ id: doc.id, ...doc.data() });
      });
      setBeans(beansList);
    } catch (err) {
      console.error('Error fetching beans:', err);
      setError('Failed to load beans.');
    } finally {
      setLoading(false);
    }
  };

  const chandleAddPrices = () => {
    // Перевірка, що всі потрібні поля заповнені
    if (
      !formData.grind ||
      formData.package === '' ||
      formData.price === null ||
      formData.size === null
    ) {
      notifyError('Please fill in all fields');
      return;
    }

    // Додаємо новий об'єкт у масив prices
    setPrices(prevPrices => [
      ...prevPrices,
      {
        grind: formData.grind,
        package: formData.package,
        price: formData.price,
        size: formData.size,
      },
    ]);

    // Очищаємо форму
    setFormData({
      grind: null,
      package: '-',
      price: null,
      size: null,
    });

    // Закриваємо форму
    setActiveModal(false);
  };

  const handleToggle = () => {
    if (activeModal === true) {
      setActiveModal(false);
      setFormData({
        grind: null,
        package: '-',
        price: null,
        size: null,
      });
    } else {
      setActiveModal(true);
    }
  };

  useEffect(() => {
    if (roasterData?.id) {
      fetchBeans();
    }
  }, [roasterData?.id]);

  if (loading) return <Loader />;
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
              {bean.name && <p className="CreateProduct-beanName"><strong>Name:</strong> {bean.name}</p>}
              {bean.country && <p className="CreateProduct-beanCountry"><strong>Country:</strong> {bean.country}</p>}
              {bean.process && <p className="CreateProduct-beanProcess"><strong>Process:</strong> {bean.process}</p>}
              {bean.flavoursByRoaster && <p className="CreateProduct-beanFlavours"><strong>Flavours:</strong> {bean.flavoursByRoaster}</p>}
              {bean.roasting && <p className="CreateProduct-beanRoasting"><strong>Roasting:</strong> {bean.roasting}</p>}
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
            onClick={() => {
              // логіка видалення при кліку
              setPrices(prev => prev.filter((_, i) => i !== index));
            }}
          />
          <div className="CreateProduct-priceItem">
            Grind: {priceItem.grind}, Package: {priceItem.package}, Price: {priceItem.price}, Size: {priceItem.size}
          </div>
        </li>
      ))}
    </ul>
  </div>
)}

<div className='CreateProduct-activeModalCon'>


          {activeModal && (
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

                {/* <label className="CreateProduct-label">
                  Grind:
                  <input
                    type="text"
                    value={formData.grind || ''}
                    onChange={e => setFormData({ ...formData, grind: e.target.value })}
                    placeholder="Whole Bean"
                    required
                    className="CreateProduct-input"
                  />
                </label> */}

<label className="CreateProduct-label">
  Grind:
  <select
    value={formData.grind || ''}
    onChange={e => setFormData({ ...formData, grind: e.target.value })}
    required
    className="CreateProduct-select"
  >
    <option value="Espresso">Espresso</option>
    <option value="Filter">Filter</option>
  </select>
</label>


                {/* <label className="CreateProduct-label">
                  Package:
                  <input
                    type="text"
                    value={formData.package}
                    onChange={e => setFormData({ ...formData, package: e.target.value })}
                    placeholder="-"
                    required
                    className="CreateProduct-input"
                  />
                </label> */}

                <label className="CreateProduct-label">
                  Price: {roasterData?.bank?.currency}
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

                <button
                  type="submit"
                  className="CreateProduct-saveBtn"
                >
                  Save
                </button>
              </form>
            </div>
          )}
          </div>
        </>
      )}
      <ToastContainer />
    </div>
  );
};

export default CreateNewProduct;
