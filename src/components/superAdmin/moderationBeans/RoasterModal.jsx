import React from "react";
import "./ModerationBeans.css";

const ModerationRoaster = ({ roaster, roasterLoading, currentBeans }) => {
  return (
    <div className="ModerationBeans-roasterData">
      {roasterLoading ? (
        <p className="ModerationBeans-roasterLoading">Loading roaster data...</p>
      ) : roaster ? (
        <div className="ModerationBeans-roasterInfo">
          <div className="ModerationBeans-roasterHeader">
            {roaster.logo && (
              <img
                src={roaster.logo}
                alt={roaster.name}
                className="ModerationBeans-roasterLogo"
              />
            )}
            {roaster.name && <h2 className="ModerationBeans-roasterName">{roaster.name}</h2>}
            {roaster.description && <p className="ModerationBeans-roasterDesc">{roaster.description}</p>}
          </div>

          {/* Contacts */}
          {(roaster.contact?.email || roaster.contact?.phone || roaster.contact?.country) && (
            <div className="ModerationBeans-roasterSection">
              <h3>📞 Contacts</h3>
              {roaster.contact?.email && <p><b>Email:</b> {roaster.contact.email}</p>}
              {roaster.contact?.phone && <p><b>Phone:</b> {roaster.contact.phone}</p>}
              {roaster.contact?.country && <p><b>Country:</b> {roaster.contact.country}</p>}
            </div>
          )}

          {/* Business Info */}
          {(roaster.business_info?.company_name ||
            roaster.business_info?.registration_number ||
            roaster.business_info?.vat_number) && (
            <div className="ModerationBeans-roasterSection">
              <h3>🏢 Business Info</h3>
              {roaster.business_info?.company_name && <p><b>Company:</b> {roaster.business_info.company_name}</p>}
              {roaster.business_info?.registration_number && <p><b>Registration:</b> {roaster.business_info.registration_number}</p>}
              {roaster.business_info?.vat_number && <p><b>VAT:</b> {roaster.business_info.vat_number}</p>}
            </div>
          )}

          {/* Bank Details */}
          {(roaster.bank_details?.bank_name ||
            roaster.bank_details?.iban ||
            roaster.bank_details?.swift ||
            roaster.bank_details?.currency ||
            roaster.bank_details?.account_holder_name ||
            roaster.bank_details?.account_holder_address ||
            roaster.bank_details?.tax_id) && (
            <div className="ModerationBeans-roasterSection">
              <h3>🏦 Bank Details</h3>
              {roaster.bank_details?.bank_name && <p><b>Bank:</b> {roaster.bank_details.bank_name}</p>}
              {roaster.bank_details?.iban && <p><b>IBAN:</b> {roaster.bank_details.iban}</p>}
              {roaster.bank_details?.swift && <p><b>SWIFT:</b> {roaster.bank_details.swift}</p>}
              {roaster.bank_details?.currency && <p><b>Currency:</b> {roaster.bank_details.currency}</p>}
              {roaster.bank_details?.account_holder_name && <p><b>Account Holder:</b> {roaster.bank_details.account_holder_name}</p>}
              {roaster.bank_details?.account_holder_address && <p><b>Holder Address:</b> {roaster.bank_details.account_holder_address}</p>}
              {roaster.bank_details?.tax_id && <p><b>Tax ID:</b> {roaster.bank_details.tax_id}</p>}
            </div>
          )}

          {/* Payment Methods */}
          {roaster.payment_methods &&
            Object.values(roaster.payment_methods).length > 0 && (
            <div className="ModerationBeans-roasterSection">
              <h3>💳 Payment Methods</h3>
              <ul>
                {Object.values(roaster.payment_methods).map((method, idx) => (
                  <li key={idx}>
                    {method.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Socials */}
          {(roaster.socials?.instagram || roaster.socials?.website) && (
            <div className="ModerationBeans-roasterSection">
              <h3>🌍 Socials</h3>
              {roaster.socials?.instagram && (
                <p>
                  <a href={roaster.socials.instagram} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                </p>
              )}
              {roaster.socials?.website && (
                <p>
                  <a href={roaster.socials.website} target="_blank" rel="noreferrer">
                    Website
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Other */}
          {(roaster.shop || roaster.shipping_available !== undefined) && (
            <div className="ModerationBeans-roasterSection">
              <h3>📦 Other</h3>
              {roaster.shop && <p><b>Shop:</b> {roaster.shop}</p>}
              {roaster.shipping_available !== undefined && (
                <p><b>Shipping Available:</b> {roaster.shipping_available ? "Yes" : "No"}</p>
              )}
            </div>
          )}

          {/* Beans */}
          <div className="ModerationBeans-roasterSection">
            <h3>☕ Beans from this Roaster</h3>
            {currentBeans.length > 0 ? (
              <ul className="ModerationBeans-beansList">
                {currentBeans.map((b) => (
                  <li key={b.id} className="ModerationBeans-beanItem">
                    <b>{b.name}</b> — {b.variety} ({b.process})
                    {b.producer && <div><i>Producer:</i> {b.producer}</div>}
                    {b.country && b.country.length > 0 && (
                      <div><i>Country:</i> {b.country.join(", ")}</div>
                    )}
                    {b.flavours && b.flavours.length > 0 && (
                      <div>
                        <i>Flavours:</i> {b.flavours.slice(0, 3).join(", ")}
                        {b.flavours.length > 3 && " ..."}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ModerationBeans-noBeans">No beans from this roaster yet</p>
            )}
          </div>
        </div>
      ) : (
        <p className="ModerationBeans-roasterNotFound">Roaster not found</p>
      )}
    </div>
  );
};

export default ModerationRoaster;
