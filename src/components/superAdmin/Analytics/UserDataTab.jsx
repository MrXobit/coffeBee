import React, { useState } from "react";
import "./Analytics.css";

const UserDataTab = ({
  userLoading,
  selectedUser,
  setActiveTab,
  logSearch,
  setLogSearch,
  fromTab
}) => {
  const [activeSection, setActiveSection] = useState(null); // "coffee" | "posts" | null

  // 🔍 Фільтрація coffee logs
  const filteredCoffeeLogs =
    selectedUser?.coffeeLogs?.filter((entry) => {
      const content = JSON.stringify(entry || "").toLowerCase();
      const term = logSearch.toLowerCase();
      return content.includes(term);
    }) || [];

  // 🔍 Фільтрація постів
  const filteredPosts =
    selectedUser?.posts?.filter((p) => {
      const content = JSON.stringify(p || "").toLowerCase();
      const term = logSearch.toLowerCase();
      return content.includes(term);
    }) || [];

  // 🌀 Лоадер
  if (userLoading) {
    return (
      <div className="Analytics-loadingBlock">
        <div className="Analytics-spinner" />
        <p>Loading user data...</p>
      </div>
    );
  }

  // ❌ Якщо нема даних
  if (
    !selectedUser ||
    (!selectedUser.coffeeLogs?.length && !selectedUser.posts?.length)
  ) {
    return (
      <div className="Analytics-tab">
        <button
          className="Analytics-backBtn"
          onClick={() => setActiveTab("users")}
        >
           ← Back to {fromTab === "active" ? "Active Users" : "All Users"}
        </button>
        <p className="Analytics-empty">No data found 😔</p>
      </div>
    );
  }

  return (
    <div className="Analytics-tab">
      <button
        className="Analytics-backBtn"
        onClick={() => setActiveTab(fromTab)}
      >
         ← Back to {fromTab === "active" ? "Active Users" : "All Users"}
      </button>

      {/* ==== ☕ Coffee Logs Header ==== */}
      <div className="Analytics-logsHeader">
        <h3 className="Analytics-subtitle">
          ☕ Coffee Logs ({selectedUser.coffeeLogs?.length || 0})
        </h3>
        <button
          className="Analytics-toggleBtn"
          onClick={() =>
            setActiveSection(activeSection === "coffee" ? null : "coffee")
          }
        >
          {activeSection === "coffee" ? "Hide Logs ▲" : "Show Logs ▼"}
        </button>
      </div>


         <div className="Analytics-logsHeader">
  <h3 className="Analytics-subtitle">
    📝 Posts ({selectedUser.posts?.length || 0})
  </h3>
  <button
    className="Analytics-toggleBtn"
    onClick={() =>
      setActiveSection(activeSection === "posts" ? null : "posts")
    }
  >
    {activeSection === "posts" ? "Hide Posts ▲" : "Show Posts ▼"}
  </button>
</div>


      {/* ==== Coffee Logs Section ==== */}
      {activeSection === "coffee" && (
        <>
          <input
            type="text"
            className="Analytics-searchInput"
            placeholder="🔍 Search in coffee logs..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
          />

          <div className="Analytics-coffeeLogs">
            {filteredCoffeeLogs.length === 0 ? (
              <p className="Analytics-empty">
                No coffee logs match your search 😔
              </p>
            ) : (
              filteredCoffeeLogs.map((entry) => (
                <div key={entry.coffee_log.id} className="Analytics-logCard">
                  {/* Coffee Log Info */}
                  <div className="Analytics-logSection">
                    <h4>📝 Coffee Log</h4>
                    <p>
                      <strong>Drink:</strong> {entry.coffee_log.drink_typeId}
                    </p>
                    <p>
                      <strong>Grade:</strong> {entry.coffee_log.grade || "N/A"}⭐
                    </p>
                    <p>
                      <strong>Date:</strong> {entry.coffee_log.date}
                    </p>
                    <p>
                      <strong>Content:</strong>{" "}
                      {entry.coffee_log.content || "No description"}
                    </p>
                  </div>

                  {/* Cafe Info */}
                  {entry.cafe ? (
                    <div className="Analytics-logSection">
                      <h4>🏠 Cafe</h4>
                      <img
                        src={
                          entry.cafe?.adminData?.photos &&
                          Object.values(entry.cafe.adminData.photos).length > 0
                            ? Object.values(entry.cafe.adminData.photos)[0]
                            : "/no-image.png"
                        }
                        alt="Cafe"
                        className="Analytics-cafeImage"
                      />
                      <p className="Analytics-cafeName">{entry.cafe.name}</p>
                      <p className="Analytics-cafeLocation">
                        {entry.cafe.city}, {entry.cafe.country}
                      </p>
                      <p>{entry.cafe.vicinity}</p>
                    </div>
                  ) : (
                    <div className="Analytics-logSection">
                      <h4>🏠 Cafe</h4>
                      <p>No cafe data</p>
                    </div>
                  )}

                  {/* Bean Info */}
                  {entry.bean ? (
                    <div className="Analytics-logSection">
                      <h4>🌱 Coffee Bean</h4>
                      <p>
                        <strong>Name:</strong> {entry.bean.name}
                      </p>
                      <p>
                        <strong>Origin:</strong>{" "}
                        {entry.bean.country?.join(", ") || "Unknown"}
                      </p>
                      <p>
                        <strong>Variety:</strong> {entry.bean.variety || "N/A"}
                      </p>
                      <p>
                        <strong>Process:</strong> {entry.bean.process || "N/A"}
                      </p>
                      <p>
                        <strong>Flavours:</strong>{" "}
                        {entry.bean.flavoursByRoaster?.join(", ") || "No info"}
                      </p>
                    </div>
                  ) : (
                    <div className="Analytics-logSection">
                      <h4>🌱 Coffee Bean</h4>
                      <p>No bean data</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ==== 📝 Posts Header ==== */}

{/* ==== Posts Section ==== */}
{activeSection === "posts" && (
  <>
    <input
      type="text"
      className="Analytics-searchInput"
      placeholder="🔍 Search in posts..."
      value={logSearch}
      onChange={(e) => setLogSearch(e.target.value)}
    />

    <div className="Analytics-coffeeLogs">
      {filteredPosts.length === 0 ? (
        <p className="Analytics-empty">No posts match your search 😔</p>
      ) : (
        filteredPosts.map((p) => (
          <div key={p.id} className="Analytics-logCard">
            {/* Основна інформація про пост */}
            <div className="Analytics-logSection">
              <h4>📝 Post</h4>
              <p>
                <strong>Drink:</strong> {p.drink_typeId || "N/A"}
              </p>
              <p>
                <strong>Grade:</strong> {p.grade || "N/A"}⭐
              </p>
              <p>
                <strong>Date:</strong> {p.date || "Unknown"}
              </p>
              <p>
                <strong>Content:</strong>{" "}
                {p.coffee_log?.content || p.content || "No description"}
              </p>
              {p.imagesUrl?.length > 0 && (
                <div className="Analytics-postImages">
                  {p.imagesUrl.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Post"
                      className="Analytics-postImage"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Cafe Info */}
            {p.cafe ? (
              <div className="Analytics-logSection">
                <h4>🏠 Cafe</h4>
                <img
                  src={
                    p.cafe?.adminData?.photos &&
                    Object.values(p.cafe.adminData.photos).length > 0
                      ? Object.values(p.cafe.adminData.photos)[0]
                      : "/no-image.png"
                  }
                  alt="Cafe"
                  className="Analytics-cafeImage"
                />
                <p className="Analytics-cafeName">{p.cafe.name}</p>
                <p className="Analytics-cafeLocation">
                  {p.cafe.city}, {p.cafe.country}
                </p>
                <p>{p.cafe.vicinity}</p>
              </div>
            ) : (
              <div className="Analytics-logSection">
                <h4>🏠 Cafe</h4>
                <p>No cafe data</p>
              </div>
            )}

            {/* Bean Info */}
            {p.bean ? (
              <div className="Analytics-logSection">
                <h4>🌱 Coffee Bean</h4>
                <p>
                  <strong>Name:</strong> {p.bean.name}
                </p>
                <p>
                  <strong>Origin:</strong>{" "}
                  {p.bean.country?.join(", ") || "Unknown"}
                </p>
                <p>
                  <strong>Variety:</strong> {p.bean.variety || "N/A"}
                </p>
                <p>
                  <strong>Process:</strong> {p.bean.process || "N/A"}
                </p>
                <p>
                  <strong>Flavours:</strong>{" "}
                  {p.bean.flavoursByRoaster?.join(", ") || "No info"}
                </p>
              </div>
            ) : (
              <div className="Analytics-logSection">
                <h4>🌱 Coffee Bean</h4>
                <p>No bean data</p>
              </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserDataTab;
