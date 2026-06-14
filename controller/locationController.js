const Location = require("../model/locationModel");

// Add a new location (Admin / Super Admin)
exports.addLocation = async (req, res) => {
  try {
    const { city, state, district, pincodes } = req.body;
    if (!city || !state || !district) {
      return res.status(400).json({
        success: false,
        message: "City, State, and District are required",
      });
    }

    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const trimmedDistrict = district.trim();

    // Automatically fetch pincodes from external Indian Postal API
    let fetchedPincodes = [];
    try {
      const resCity = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(trimmedCity)}`);
      const dataCity = await resCity.json();
      if (dataCity && dataCity[0] && dataCity[0].Status === "Success") {
        const pos = dataCity[0].PostOffice || [];
        for (const po of pos) {
          if (po.State && po.State.toLowerCase() === trimmedState.toLowerCase()) {
            fetchedPincodes.push(po.Pincode);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching pincodes by city name:", err.message);
    }

    // Try district name fallback if city lookup returned no pincodes
    if (fetchedPincodes.length === 0 && trimmedDistrict.toLowerCase() !== trimmedCity.toLowerCase()) {
      try {
        const resDist = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(trimmedDistrict)}`);
        const dataDist = await resDist.json();
        if (dataDist && dataDist[0] && dataDist[0].Status === "Success") {
          const pos = dataDist[0].PostOffice || [];
          for (const po of pos) {
            if (po.State && po.State.toLowerCase() === trimmedState.toLowerCase()) {
              fetchedPincodes.push(po.Pincode);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching pincodes by district name:", err.message);
      }
    }

    // Filter and make unique
    let parsedPincodes = [...new Set(fetchedPincodes)].filter(Boolean);

    // Fallback to manually provided pincodes if API fetch was completely unsuccessful
    if (parsedPincodes.length === 0 && pincodes) {
      parsedPincodes = Array.isArray(pincodes)
        ? pincodes.map(p => p.trim()).filter(Boolean)
        : pincodes.toString().split(",").map(p => p.trim()).filter(Boolean);
    }

    if (parsedPincodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Could not automatically fetch any pincodes for ${trimmedCity}. Please verify State & District spelling.`,
      });
    }

    // Case-insensitive check
    const existing = await Location.findOne({
      city: { $regex: new RegExp(`^${trimmedCity}$`, "i") }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Location (City) already exists",
      });
    }

    const pincodeObjects = parsedPincodes.map(pin => ({ pincode: pin, isActive: true }));

    const location = await Location.create({
      city: trimmedCity,
      state: trimmedState,
      district: trimmedDistrict,
      pincodes: pincodeObjects,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: `Location added successfully with ${parsedPincodes.length} pincodes!`,
      data: location
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all locations (Admin / Super Admin)
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ city: 1 });
    return res.status(200).json({
      success: true,
      data: locations
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get active locations (Public / Provider signup / Bookings)
exports.getActiveLocations = async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true }).sort({ city: 1 });
    return res.status(200).json({
      success: true,
      data: locations
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle location active/inactive status (Admin / Super Admin)
exports.toggleLocationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    location.isActive = !location.isActive;
    await location.save();

    return res.status(200).json({
      success: true,
      message: `Location status updated to ${location.isActive ? "active" : "inactive"}`,
      data: location
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete location (Admin / Super Admin)
exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findByIdAndDelete(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Location deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle active/inactive status of a specific pincode in a location (Admin / Super Admin)
exports.togglePincodeStatus = async (req, res) => {
  try {
    const { locationId, pincode } = req.body;
    if (!locationId || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Location ID and Pincode are required",
      });
    }

    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    const pinObj = location.pincodes.find(p => p.pincode === pincode.toString().trim());
    if (!pinObj) {
      return res.status(404).json({
        success: false,
        message: "Pincode not found in this location",
      });
    }

    pinObj.isActive = !pinObj.isActive;
    await location.save();

    return res.status(200).json({
      success: true,
      message: `Pincode ${pincode} status updated to ${pinObj.isActive ? "active" : "inactive"}`,
      data: location,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Lookup pincode to return State, District, City (Super Admin dynamic search)
exports.pincodeLookup = async (req, res) => {
  try {
    const { pincode } = req.params;
    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: "Pincode parameter is required",
      });
    }

    const trimmedPin = pincode.trim();
    const response = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(trimmedPin)}`);
    const data = await response.json();

    if (data && data[0] && data[0].Status === "Success") {
      const pos = data[0].PostOffice || [];
      if (pos.length > 0) {
        const state = pos[0].State;
        const district = pos[0].District;
        const city = pos[0].District; // In Indian addressing, the district serves as the main urban city hub

        return res.status(200).json({
          success: true,
          message: "Pincode resolved successfully",
          data: {
            city,
            state,
            district,
            pincode: trimmedPin
          }
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: "No location records found for this pincode"
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
