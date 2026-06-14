const mongoose = require("mongoose");
const Category = require("../model/categoryModel");
const Service = require("../model/serviceModel");
const Provider = require("../model/providerModel");
const User = require("../model/userModel");
const ProviderService = require("../model/providerServicModel");

const seedDatabase = async () => {
  try {
    console.log("Checking database for seeding...");

    // 1. Approve all providers that are pending for electricity category so they can offer services
    const electricityCategory = await Category.findOne({ name: "electricity" });
    if (electricityCategory) {
      const elecProviders = await Provider.find({ category: electricityCategory._id });
      for (const provider of elecProviders) {
        if (provider.kycStatus !== "approved") {
          provider.kycStatus = "approved";
          await provider.save();
          console.log(`Approved provider ${provider.businessName}`);
          
          await User.findByIdAndUpdate(provider.user, { status: "active" });
        }
      }
    }

    // 2. Approve ac providers
    const acCategory = await Category.findOne({ name: "ac" });
    if (acCategory) {
      const acProviders = await Provider.find({ category: acCategory._id });
      for (const provider of acProviders) {
        if (provider.kycStatus !== "approved") {
          provider.kycStatus = "approved";
          await provider.save();
          console.log(`Approved provider ${provider.businessName}`);

          await User.findByIdAndUpdate(provider.user, { status: "active" });
        }
      }
    }

    // 3. Retrieve first superAdmin or admin to set createdBy
    const adminUser = await User.findOne({ role: { $in: ["superAdmin", "admin"] } });
    const creatorId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

    // 4. Create services if services collection is empty
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      console.log("Seeding services...");
      
      const sampleServices = [];

      if (electricityCategory) {
        sampleServices.push(
          {
            category: electricityCategory._id,
            serviceName: "Fan Repairing",
            description: "Complete repair of ceiling, table or pedestal fans including motor winding checks.",
            basePrice: 150,
            estimatedDuration: 45,
            createdBy: creatorId,
            isActive: true,
          },
          {
            category: electricityCategory._id,
            serviceName: "Switchboard Installation & Repair",
            description: "Replacement or fresh installation of domestic switchboards, switches, sockets, and regulators.",
            basePrice: 200,
            estimatedDuration: 30,
            createdBy: creatorId,
            isActive: true,
          }
        );
      }

      if (acCategory) {
        sampleServices.push(
          {
            category: acCategory._id,
            serviceName: "AC Gas Charging",
            description: "Top-up or full refill of eco-friendly refrigerant gas for split/window AC units with leak checks.",
            basePrice: 1200,
            estimatedDuration: 60,
            createdBy: creatorId,
            isActive: true,
          },
          {
            category: acCategory._id,
            serviceName: "AC Wet Cleaning & Service",
            description: "Deep jet pressure wet service for indoor and outdoor AC units to improve cooling efficiency.",
            basePrice: 499,
            estimatedDuration: 90,
            createdBy: creatorId,
            isActive: true,
          }
        );
      }

      if (sampleServices.length > 0) {
        await Service.insertMany(sampleServices);
        console.log("Services seeded successfully.");
      }
    }

    // 5. Link services to providers in ProviderService
    const providerServiceCount = await ProviderService.countDocuments();
    if (providerServiceCount === 0) {
      console.log("Mapping services to providers in ProviderService...");
      
      const allServices = await Service.find({});
      const allProviders = await Provider.find({ kycStatus: "approved" });

      const providerServicesToCreate = [];

      for (const service of allServices) {
        // Find providers registered under the same category as this service
        const matchingProviders = allProviders.filter(
          (p) => p.category && p.category.toString() === service.category.toString()
        );

        for (const provider of matchingProviders) {
          providerServicesToCreate.push({
            provider: provider._id,
            service: service._id,
            price: service.basePrice,
            isAvailable: true,
          });
        }
      }

      if (providerServicesToCreate.length > 0) {
        await ProviderService.insertMany(providerServicesToCreate);
        console.log(`Successfully mapped ${providerServicesToCreate.length} provider-service connections.`);
      }
    }

    console.log("Database check/seeding finished.");
  } catch (error) {
    console.error("Seeding Error:", error);
  }
};

module.exports = seedDatabase;
