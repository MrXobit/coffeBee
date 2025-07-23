import React, { useState, useEffect } from 'react';
import ToggleSwitch from '../../toggleSwitch/ToggleSwitch';
import './Products.css';
import { useSelector } from 'react-redux';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import './Products.css'
import { useNavigate } from 'react-router-dom';
import Loader from '../../loader/Loader';
import CreateNewProduct from './CreateNewProduct/CreateNewProduct';


const Products = () => {
  const [allProducts, setAllProducts] = useState(true);
  const { roasterData } = useSelector(state => state.roaster);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()
  const fetchData = async () => {
    if (!roasterData?.id) {
      return;
    }

    setLoading(true);
    try {
      const productsRef = collection(db, 'roasters', roasterData.id, 'products');
      const querySnapshot = await getDocs(productsRef);

      const productsArray = [];
      querySnapshot.forEach((doc) => {
        const productData = doc.data();
        productsArray.push({ id: doc.id, ...productData });
      });

      setProducts(productsArray);
      console.log(productsArray);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (roasterData?.id) {
      fetchData();
    }
  }, [roasterData?.id]);


  useEffect(() => {
    if (roasterData?.id) {
      fetchData();
    }
  }, [roasterData?.id]);


  useEffect(() => {
    const savedMode = localStorage.getItem('productsViewMode');
    if (savedMode !== null) {
      setAllProducts(JSON.parse(savedMode));
    }
  }, []);



  const handleToggle = (value) => {
    setAllProducts(value);
    localStorage.setItem('productsViewMode', JSON.stringify(value));
  };

  return (
    <div className="ProductsRo-wrapper">
    <div className="ProductsRo-container">

      <h2 className="ProductsRo-title">{allProducts ? 'Your Products' : 'Add New Product'}</h2>

      <div className='toggle-module-centerrr'>
          <ToggleSwitch
            toggleValue={allProducts}
            onToggle={handleToggle}
            words={['Products', 'Add Product']}
          />
        </div>

{loading ? 
<div className='ProductsRo-loader'><Loader/></div> : 
<>
{allProducts ? (
  products.length === 0 ? (
    <p className="ProductsRo-noProducts">No products found.</p>  // Якщо масив пустий
  ) : (
    <div className="ProductsRo-list">
      {products.map(product => (
        <div
          onClick={() => navigate(`/product/${product.id}`)}
          key={product.id}
          className="ProductsRo-card"
        >
          <img
            src={product.pack_image_url || '/default-image.jpg'}
            alt={product.coffee_name || 'Product image'}
            className="ProductsRo-image"
          />
          <h3 className="ProductsRo-coffeeName">{product.coffee_name || 'Unnamed Product'}</h3>
          <p className="ProductsRo-country"><strong>Country:</strong> {product.country || 'N/A'}</p>
          <p className="ProductsRo-description">{product.short_description || 'No description available.'}</p>
        </div>
      ))}
    </div>
  )
) : (
  <CreateNewProduct/>
)}
</>
}
     

    </div>
  </div>
  );
};

export default Products;
