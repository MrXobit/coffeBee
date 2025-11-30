import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import "./Analytics.css";
import UserDataTab from "./UserDataTab";
import noImg from '../../../assets/noUserImg.png'
const Analytics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    usersWithLastVisit: 0,
    activeUsersTwoWeeks: 0,
    firstOpens: 0,
    uniqueFirstOpens: 0,
    recentUsers: [],
    allUsers: [],
    activeUsers: [],
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [search, setSearch] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [logSearch, setLogSearch] = useState("");
  const [showLogs, setShowLogs] = useState(false);

  const loadData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const firstOpensSnap = await getDocs(collection(db, "first_opens"));
      const firstOpens = firstOpensSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const totalUsers = users.length;
      const firstOpensCount = firstOpens.length;
      const usersWithLastVisit = users.filter((u) => u.lastVisit).length;

      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const activeUsers = users.filter((u) => {
        if (!u.lastVisit) return false;
        const visitDate = new Date(u.lastVisit.seconds * 1000);
        return visitDate >= twoWeeksAgo;
      });

      const recentUsers = users
        .filter((u) => u.lastVisit)
        .sort(
          (a, b) =>
            new Date(b.lastVisit.seconds * 1000) -
            new Date(a.lastVisit.seconds * 1000)
        )
        .slice(0, 10);

      setStats({
        totalUsers,
        usersWithLastVisit,
        activeUsersTwoWeeks: activeUsers.length,
        firstOpens: firstOpensCount,
        recentUsers,
        allUsers: users,
        activeUsers,
      });
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  loadData(); // залишаємо стару функцію
  loadActivityStats(); // нова статистика
}, []);



  const filteredUsers = stats.allUsers.filter((u) => {
    const searchLower = search.toLowerCase();
    const idMatch = u.id.toLowerCase().includes(searchLower);
    const nameMatch = u.name?.toLowerCase().includes(searchLower);
    const emailMatch = u.email?.toLowerCase().includes(searchLower);
    return idMatch || nameMatch || emailMatch;
  });


const handleUserDetails = async (userId, fromTab = "users") => {
  console.log("▶️ handleUserDetails called with userId:", userId);
  if (activeTab !== "userData") setActiveTab("userData");
  setUserLoading(true);

  try {
    // --- 1️⃣ Отримати coffee logs
    const coffeeLogRef = collection(db, "users", userId, "coffee_log");
    const coffeeSnapshot = await getDocs(coffeeLogRef);
    const coffeeLogs = coffeeSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // --- 2️⃣ Отримати пости користувача
    const postsRef = collection(db, "posts");
    const postsSnap = await getDocs(postsRef);
    const userPosts = postsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((p) => p.userId === userId);

    // --- 3️⃣ Деталізуємо coffee logs (як і раніше)
    const detailedCoffeeLogs = await Promise.all(
      coffeeLogs.map(async (log) => {
        let cafeData = null;
        let beanData = null;

        const cafePromise = log.cafeId
          ? getDoc(doc(db, "cafes", log.cafeId)).then((snap) =>
              snap.exists() ? { id: log.cafeId, ...snap.data() } : null
            )
          : Promise.resolve(null);

        const beanPromise = log.beansId
          ? getDoc(doc(db, "beans", log.beansId)).then((snap) =>
              snap.exists() ? { id: log.beansId, ...snap.data() } : null
            )
          : Promise.resolve(null);

        [cafeData, beanData] = await Promise.all([cafePromise, beanPromise]);

        return {
          coffee_log: log,
          cafe: cafeData,
          bean: beanData,
        };
      })
    );

    // --- 4️⃣ Деталізуємо пости (нове)
    const detailedPosts = await Promise.all(
      userPosts.map(async (post) => {
        let cafeData = null;
        let beanData = null;

        const cafePromise =
          post.cafeId && post.cafeId !== "defaultCafe"
            ? getDoc(doc(db, "cafes", post.cafeId)).then((snap) =>
                snap.exists() ? { id: post.cafeId, ...snap.data() } : null
              )
            : Promise.resolve(null);

        const beanPromise = post.beansId
          ? getDoc(doc(db, "beans", post.beansId)).then((snap) =>
              snap.exists() ? { id: post.beansId, ...snap.data() } : null
            )
          : Promise.resolve(null);

        [cafeData, beanData] = await Promise.all([cafePromise, beanPromise]);

        return {
          ...post,
          cafe: cafeData,
          bean: beanData,
        };
      })
    );

    // --- 5️⃣ Зберігаємо все разом
       setSelectedUser({
      coffeeLogs: detailedCoffeeLogs,
      posts: detailedPosts,
      fromTab, // передаємо звідки
    });

  } catch (error) {
    console.error("💥 Error loading user data:", error);
       setSelectedUser({ coffeeLogs: [], posts: [], fromTab });
  } finally {
    console.log("🏁 Done loading user data");
    setUserLoading(false);
  }
};

const loadActivityStats = async () => {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const users = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const postsSnap = await getDocs(collection(db, "posts"));
    const posts = postsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        const coffeeSnap = await getDocs(collection(db, "users", user.id, "coffee_log"));
        const coffeeLogs = coffeeSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const userPosts = posts.filter((p) => p.userId === user.id);

        return {
          ...user,
          coffeeLogs,
          posts: userPosts,
        };
      })
    );

    // Аналіз
    let coffeeLogOnly = 0;
    let postsOnly = 0;
    let both = 0;
    let none = 0;

    usersWithActivity.forEach(u => {
      const hasCoffee = u.coffeeLogs.length > 0;
      const hasPosts = u.posts.length > 0;

      if (hasCoffee && hasPosts) both++;
      else if (hasCoffee) coffeeLogOnly++;
      else if (hasPosts) postsOnly++;
      else none++;
    });

    setStats(prev => ({
      ...prev,
      allUsers: usersWithActivity,
      usersWithCoffeeLogs: coffeeLogOnly + both,
      usersWithPosts: postsOnly + both,
      usersWithActivity: coffeeLogOnly + postsOnly + both,
      usersWithNothing: none
    }));

  } catch (err) {
    console.error("Error loading activity stats:", err);
  }
};


  const renderTab = () => {
    switch (activeTab) {
      case "users":
        return (
          <div className="Analytics-tab">
            <h3>👥 All Users</h3>

<div className="Analytics-statsGrid">
  <div className="Analytics-statCard">
    <span className="Analytics-statLabel">☕ Coffee Logs</span>
    <span className="Analytics-statValue">{stats.usersWithCoffeeLogs}</span>
  </div>

  <div className="Analytics-statCard">
    <span className="Analytics-statLabel">📝 Posts</span>
    <span className="Analytics-statValue">{stats.usersWithPosts}</span>
  </div>

  <div className="Analytics-statCard">
    <span className="Analytics-statLabel">⚡ Activity</span>
    <span className="Analytics-statValue">{stats.usersWithActivity}</span>
  </div>

  <div className="Analytics-statCard">
    <span className="Analytics-statLabel">❌ None</span>
    <span className="Analytics-statValue">{stats.usersWithNothing}</span>
  </div>
</div>



            <input
              type="text"
              className="Analytics-searchInput"
              placeholder="🔍 Search by name, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <ul className="Analytics-userList">
              {filteredUsers.length === 0 ? (
                <p className="Analytics-empty">No results found 😔</p>
              ) : (
                filteredUsers.map((u) => (
                  <li
                    key={u.id}
                    className="Analytics-userItem"
                    onClick={() => handleUserDetails(u.id)}
                  >
                    <img
                      src={u.logo || noImg}
                      className="Analytics-userAvatar"
                    />
                    <div>
                      <div className="Analytics-userName">
                        {u.name || u.email || u.id}
                      </div>
                      {u.lastVisit && (
                        <div className="Analytics-userLastVisit">
                          {new Date(
                            u.lastVisit.seconds * 1000
                          ).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        );

      case "userData":
        return (
          <UserDataTab
            userLoading={userLoading}
            selectedUser={selectedUser}
            setActiveTab={setActiveTab}
            showLogs={showLogs}
            setShowLogs={setShowLogs}
            logSearch={logSearch}
            setLogSearch={setLogSearch}
            fromTab={selectedUser?.fromTab || "users"} 
          />
        );

case "active":
  return (
    <div className="Analytics-tab">
      <h3>🔥 Active in the Last 14 Days</h3>

      <ul className="Analytics-userList">
        {[...stats.activeUsers]
          .sort(
            (a, b) =>
              new Date(b.lastVisit.seconds * 1000) -
              new Date(a.lastVisit.seconds * 1000)
          )
          .map((u) => (
            <li
              key={u.id}
              className="Analytics-userItem"
              onClick={() => handleUserDetails(u.id, 'active')} // відкриває детальну інфу
            >
              <img
                src={u.logo || "/default-avatar.png"}
                className="Analytics-userAvatar"
              />
              <div>
                <div className="Analytics-userName">
                  {u.name || u.email || u.id}
                </div>
                {u.lastVisit && (
                  <div className="Analytics-userLastVisit">
                    {new Date(u.lastVisit.seconds * 1000).toLocaleString()}
                  </div>
                )}
              </div>
            </li>
          ))}
      </ul>
    </div>
  );

      default:
        return null;
    }
  };

  if (loading)
    return <p className="Analytics-loading">Loading analytics...</p>;

  return (
    <div className="Analytics-container">
      <h2 className="Analytics-title">📊 User Analytics</h2>
      <p className="Analytics-summary">
        🚀 First Opens: <strong>{stats.firstOpens}</strong>
      </p>

      <div className="Analytics-cards">
        <div
          className={`Analytics-card ${
            activeTab === "users" ? "active" : ""
          }`}
          onClick={() =>
            setActiveTab(activeTab === "users" ? null : "users")
          }
        >
          👥 <span>Total Users:</span> {stats.totalUsers}
        </div>

        <div
          className={`Analytics-card ${
            activeTab === "active" ? "active" : ""
          }`}
          onClick={() =>
            setActiveTab(activeTab === "active" ? null : "active")
          }
        >
          🔥 <span>Active (14 Days):</span> {stats.activeUsersTwoWeeks}
        </div>
      </div>

      {activeTab && <div className="Analytics-tabContainer">{renderTab()}</div>}
    </div>
  );
};

export default Analytics;
