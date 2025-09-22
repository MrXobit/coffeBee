import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import "./RoasterDetailsModeraition.css";
import back from '../../../../assets/back.png'
import defoultImg from '../../../../assets/noImage.jpeg'

const RoasterDetailsModeraition = () => {
  const { id } = useParams();
  const [roaster, setRoaster] = useState(null);
  const [beans, setBeans] = useState([]);
  const [loading, setLoading] = useState(true);


    const navigate = useNavigate();


useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      const roasterRef = doc(db, "roasters", id);
      const roasterSnap = await getDoc(roasterRef);

      if (roasterSnap.exists()) {
        setRoaster({ id: roasterSnap.id, ...roasterSnap.data() });

        const beansRef = collection(db, "beans");

        // перший пошук — по id ростера
        const q1 = query(
          beansRef,
          where("roaster", "==", id),
          where("isVerified", "==", true)
        );
        const beansSnap1 = await getDocs(q1);
        let beans = beansSnap1.docs.map((d) => ({ id: d.id, ...d.data() }));

        // другий пошук — тільки якщо aliasId є і їх більше ніж 1
        const aliasIds = roasterSnap.data().aliasId;
        if (Array.isArray(aliasIds) && aliasIds.length > 1) {
          const q2 = query(
            beansRef,
            where("roaster", "in", aliasIds),
            where("isVerified", "==", true)
          );
          const beansSnap2 = await getDocs(q2);
          const beans2 = beansSnap2.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));

          // додаємо результати
          beans = [...beans, ...beans2];
        }

        setBeans(beans);
      } else {
        setRoaster(null);
        setBeans([]);
      }
    } catch (err) {
      console.error("Error loading roaster/beans:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [id]);


  if (loading) {
    return <div className="RoasterDetailsModeraition-loader">Loading...</div>;
  }

  if (!roaster) {
    return <div className="RoasterDetailsModeraition-not-found">Roaster not found</div>;
  }

  return (
    <div className="RoasterDetailsModeraition-container">
    <img
        src={back}
        alt="back"
        className="RoasterDetailsModeraition-back"
        onClick={() => navigate("/")}
      />
      <div className="RoasterDetailsModeraition-roaster-card">
        <img
          src={roaster.logo || defoultImg}
          alt="Roaster Logo"
          className="RoasterDetailsModeraition-roaster-logo"
        />
        <div className="RoasterDetailsModeraition-roaster-info">
          <h1>{roaster.name}</h1>
          <p>{roaster.description || "No description available"}</p>
          <p>
            🌍 {roaster.country || "Unknown"}{" "}
            {roaster.city && `• ${roaster.city}`}
          </p>
        </div>
      </div>

      <h2 className="RoasterDetailsModeraition-beans-title">Available Beans</h2>
      <div className="RoasterDetailsModeraition-beans-grid">
        {beans.length > 0 ? (
          beans.map((bean) => (
            <div key={bean.id} className="RoasterDetailsModeraition-bean-card">
           
              <h3>{bean.name}</h3>
    
            </div>
          ))
        ) : (
          <p className="RoasterDetailsModeraition-no-beans">
            No beans found for this roaster
          </p>
        )}
      </div>
    </div>
  );
};

export default RoasterDetailsModeraition;
