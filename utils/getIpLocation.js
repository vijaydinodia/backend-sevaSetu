/**
 * getIpLocation.js
 *
 * Looks up city, region, country from an IP address
 * using the FREE ip-api.com service (no API key needed).
 *
 * Limit: 45 requests per minute (enough for login events).
 *
 * NOTE: On localhost, IP will be "127.0.0.1" or "::1"
 *       so location will return "Unknown". This is normal.
 *       It works correctly when deployed to production.
 *
 * Usage:
 *   const { getIpLocation } = require("../utils/getIpLocation");
 *   const location = await getIpLocation("8.8.8.8");
 *   // location = { city: "Mountain View", region: "California", country: "United States" }
 */

const axios = require("axios");

const getIpLocation = async (ip) => {
  // Default location if lookup fails
  const unknown = { city: "Unknown", region: "Unknown", country: "Unknown" };

  try {
    // Skip lookup for localhost IPs (won't work anyway)
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1") {
      return { city: "Localhost", region: "Localhost", country: "Localhost" };
    }

    // Call ip-api.com (free, no API key needed)
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 3000, // 3 second timeout so login doesn't hang
    });

    if (response.data && response.data.status === "success") {
      return {
        city: response.data.city || "Unknown",
        region: response.data.regionName || "Unknown",
        country: response.data.country || "Unknown",
      };
    }

    return unknown;
  } catch (error) {
    // If API is down or error, just return unknown
    // We don't want login to fail because of location lookup
    console.log("IP location lookup failed (non-critical):", error.message);
    return unknown;
  }
};

module.exports = { getIpLocation };
