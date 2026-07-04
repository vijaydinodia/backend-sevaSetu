/**
 * parseUserAgent.js
 *
 * A simple helper to extract device type, OS, and browser
 * from the User-Agent header string.
 *
 * No npm package needed — just basic regex matching.
 *
 * Usage:
 *   const { parseUserAgent } = require("../utils/parseUserAgent");
 *   const info = parseUserAgent(req.headers["user-agent"]);
 *   // info = { deviceType: "Mobile", os: "Android 14", browser: "Chrome 125" }
 */

const parseUserAgent = (ua) => {
  // If no User-Agent string, return unknown
  if (!ua || typeof ua !== "string") {
    return { deviceType: "Unknown", os: "Unknown", browser: "Unknown" };
  }

  // --- 1) Detect Device Type ---
  let deviceType = "Desktop"; // default

  if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
    deviceType = "Mobile";
  } else if (/iPad|Tablet/i.test(ua)) {
    deviceType = "Tablet";
  }

  // --- 2) Detect OS ---
  let os = "Unknown";

  if (/Windows NT 10/i.test(ua)) {
    os = "Windows 10";
  } else if (/Windows NT 11/i.test(ua) || (/Windows NT 10/i.test(ua) && /Win64/i.test(ua))) {
    // Windows 11 often reports as Windows NT 10.0 too
    os = "Windows 10/11";
  } else if (/Windows NT 6\.3/i.test(ua)) {
    os = "Windows 8.1";
  } else if (/Windows NT 6\.2/i.test(ua)) {
    os = "Windows 8";
  } else if (/Windows NT 6\.1/i.test(ua)) {
    os = "Windows 7";
  } else if (/Windows/i.test(ua)) {
    os = "Windows";
  } else if (/Mac OS X (\d+[._]\d+)/i.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/i);
    os = "macOS " + (match ? match[1].replace(/_/g, ".") : "");
  } else if (/Mac OS X/i.test(ua)) {
    os = "macOS";
  } else if (/Android (\d+(\.\d+)?)/i.test(ua)) {
    const match = ua.match(/Android (\d+(\.\d+)?)/i);
    os = "Android " + (match ? match[1] : "");
  } else if (/Android/i.test(ua)) {
    os = "Android";
  } else if (/iPhone OS (\d+[._]\d+)/i.test(ua)) {
    const match = ua.match(/iPhone OS (\d+[._]\d+)/i);
    os = "iOS " + (match ? match[1].replace(/_/g, ".") : "");
  } else if (/iPad.*OS (\d+[._]\d+)/i.test(ua)) {
    const match = ua.match(/OS (\d+[._]\d+)/i);
    os = "iPadOS " + (match ? match[1].replace(/_/g, ".") : "");
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = "iOS";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  } else if (/CrOS/i.test(ua)) {
    os = "Chrome OS";
  }

  // --- 3) Detect Browser ---
  let browser = "Unknown";

  // Order matters! Check specific browsers before generic ones
  if (/Edg\/(\d+)/i.test(ua)) {
    const match = ua.match(/Edg\/(\d+)/i);
    browser = "Edge " + (match ? match[1] : "");
  } else if (/OPR\/(\d+)/i.test(ua) || /Opera\/(\d+)/i.test(ua)) {
    const match = ua.match(/OPR\/(\d+)/i) || ua.match(/Opera\/(\d+)/i);
    browser = "Opera " + (match ? match[1] : "");
  } else if (/SamsungBrowser\/(\d+)/i.test(ua)) {
    const match = ua.match(/SamsungBrowser\/(\d+)/i);
    browser = "Samsung Browser " + (match ? match[1] : "");
  } else if (/UCBrowser\/(\d+)/i.test(ua)) {
    const match = ua.match(/UCBrowser\/(\d+)/i);
    browser = "UC Browser " + (match ? match[1] : "");
  } else if (/Brave/i.test(ua)) {
    browser = "Brave";
  } else if (/Vivaldi\/(\d+)/i.test(ua)) {
    const match = ua.match(/Vivaldi\/(\d+)/i);
    browser = "Vivaldi " + (match ? match[1] : "");
  } else if (/Chrome\/(\d+)/i.test(ua) && !/Chromium/i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+)/i);
    browser = "Chrome " + (match ? match[1] : "");
  } else if (/Firefox\/(\d+)/i.test(ua)) {
    const match = ua.match(/Firefox\/(\d+)/i);
    browser = "Firefox " + (match ? match[1] : "");
  } else if (/Safari\/(\d+)/i.test(ua) && !/Chrome/i.test(ua)) {
    const match = ua.match(/Version\/(\d+(\.\d+)?)/i);
    browser = "Safari " + (match ? match[1] : "");
  } else if (/MSIE (\d+)/i.test(ua) || /Trident/i.test(ua)) {
    browser = "Internet Explorer";
  }

  return { deviceType, os, browser };
};

module.exports = { parseUserAgent };
