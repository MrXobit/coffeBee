import React, { useEffect, useState } from 'react'
import './ProductDetails.css'
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { useSelector } from 'react-redux';
import SubLoader from '../../../loader/SubLoader';
import back from '../../../../assets/back.png';
const ProductDetails = () => {
    const [product, setProduct] = useState(null);
    const { id } = useParams();
    const { roasterData } = useSelector(state => state.roaster);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate()
    useEffect(() => {
      if (!roasterData?.id || !id) return;

      const fetchData = async () => {
        setError(null);
        try {
          const productRef = doc(db, 'roasters', roasterData.id, 'products', id);
          const docSnap = await getDoc(productRef);

          if (docSnap.exists()) {
            setProduct({ id: docSnap.id, ...docSnap.data() });
          } else {
            setError('Product not found.');
            setProduct(null);
          }
        } catch (e) {
          console.error(e);
          setError('Something went wrong while fetching the product.');
          setProduct(null);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [roasterData?.id, id]);

    if (loading) return <SubLoader />;
    if (error) return <p className="ProductDetails-error">{error}</p>;
    if (!product) return <p>No product data available.</p>;

    const isValidField = (value) => {
        return value !== null && value !== undefined && value !== '' && value !== '-';
      };
      

    return (
        <div className="ProductDetailsRo-wrapper">
        <img onClick={() => navigate('/')} src={back} className='ProductDetailsRo-back' />
  
        {isValidField(product.coffee_name) && (
          <h1 className="ProductDetailsRo-title">{product.coffee_name}</h1>
        )}
  
        {isValidField(product.pack_image_url) && (
          <img
            src={product.pack_image_url}
            alt={product.coffee_name || 'Product image'}
            className="ProductDetailsRo-image"
          />
        )}
  
        {isValidField(product.roastery_name) && (
          <p className="ProductDetailsRo-field"><strong>Roastery:</strong> {product.roastery_name}</p>
        )}
  
        {isValidField(product.country) && (
          <p className="ProductDetailsRo-field"><strong>Country:</strong> {product.country}</p>
        )}
  
        {isValidField(product.region) && (
          <p className="ProductDetailsRo-field"><strong>Region:</strong> {product.region}</p>
        )}
  
        {isValidField(product.processing) && (
          <p className="ProductDetailsRo-field"><strong>Processing:</strong> {product.processing}</p>
        )}
  
        {isValidField(product.processing_details) && (
          <p className="ProductDetailsRo-field"><strong>Processing Details:</strong> {product.processing_details}</p>
        )}
  
        {isValidField(product.roasted_for) && (
          <p className="ProductDetailsRo-field"><strong>Roasted For:</strong> {product.roasted_for}</p>
        )}
  
        {isValidField(product.roasting) && (
          <p className="ProductDetailsRo-field"><strong>Roasting:</strong> {product.roasting}</p>
        )}
  
        {isValidField(product.variety) && (
          <p className="ProductDetailsRo-field"><strong>Variety:</strong> {product.variety}</p>
        )}
  
        {isValidField(product.harvest_year) && (
          <p className="ProductDetailsRo-field"><strong>Harvest Year:</strong> {product.harvest_year}</p>
        )}
  
        {isValidField(product.altitude) && (
          <p className="ProductDetailsRo-field"><strong>Altitude:</strong> {product.altitude}</p>
        )}
  
        {isValidField(product.farm) && (
          <p className="ProductDetailsRo-field"><strong>Farm:</strong> {product.farm}</p>
        )}
  
        {isValidField(product.producer) && (
          <p className="ProductDetailsRo-field"><strong>Producer:</strong> {product.producer}</p>
        )}
  
        {isValidField(product.special_notes) && (
          <p className="ProductDetailsRo-field"><strong>Special Notes:</strong> {product.special_notes}</p>
        )}
  
        {isValidField(product.story) && (
          <p className="ProductDetailsRo-field"><strong>Story:</strong> {product.story}</p>
        )}
  
        {isValidField(product.short_description) && (
          <p className="ProductDetailsRo-field"><strong>Short Description:</strong> {product.short_description}</p>
        )}
  
        {isValidField(product.acidity) && (
          <p className="ProductDetailsRo-field"><strong>Acidity:</strong> {product.acidity}</p>
        )}
  
        {isValidField(product.aftertaste) && (
          <p className="ProductDetailsRo-field"><strong>Aftertaste:</strong> {product.aftertaste}</p>
        )}
  
        {isValidField(product.bitterness) && (
          <p className="ProductDetailsRo-field"><strong>Bitterness:</strong> {product.bitterness}</p>
        )}
  
        {isValidField(product.body_texture) && (
          <p className="ProductDetailsRo-field"><strong>Body Texture:</strong> {product.body_texture}</p>
        )}
  
        {isValidField(product.complexity) && (
          <p className="ProductDetailsRo-field"><strong>Complexity:</strong> {product.complexity}</p>
        )}
  
        {isValidField(product.sweetness) && (
          <p className="ProductDetailsRo-field"><strong>Sweetness:</strong> {product.sweetness}</p>
        )}
  
        {isValidField(product.taste_profile) && (
          <p className="ProductDetailsRo-field"><strong>Taste Profile:</strong> {product.taste_profile}</p>
        )}
  
        {isValidField(product.aroma) && (
          <p className="ProductDetailsRo-field"><strong>Aroma:</strong> {product.aroma}</p>
        )}
  
        {product.flavours?.length > 0 && (
          <p className="ProductDetailsRo-field"><strong>Flavours:</strong> {product.flavours.join(', ')}</p>
        )}
  
        {product.brew_methods?.length > 0 && (
          <p className="ProductDetailsRo-field"><strong>Brew Methods:</strong> {product.brew_methods.join(', ')}</p>
        )}
  
        {product.certifications?.length > 0 && (
          <p className="ProductDetailsRo-field"><strong>Certifications:</strong> {product.certifications.join(', ')}</p>
        )}
  
        {product.prices?.length > 0 && (
          <>
            <p className="ProductDetailsRo-field"><strong>Prices:</strong></p>
            <ul className="ProductDetailsRo-priceList">
              {product.prices.map((priceObj, i) => (
                <li key={i} className="ProductDetailsRo-priceItem">
                  {priceObj.price ? `Price: ${priceObj.price} ${product.currency || ''}` : ''}
                  {priceObj.size ? `, Size: ${priceObj.size}g` : ''}
                  {priceObj.package ? `, Package: ${priceObj.package}` : ''}
                  {priceObj.grind ? `, Grind: ${priceObj.grind}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
  
        {isValidField(product.product_url) && (
          <p className="ProductDetailsRo-link">
            <a href={product.product_url} target="_blank" rel="noopener noreferrer">Product Link</a>
          </p>
        )}
      </div>
      );
      
      
}

export default ProductDetails;
