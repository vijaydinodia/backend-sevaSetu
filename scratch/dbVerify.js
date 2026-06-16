const path = require("path");
const backendPath = "C:/Users/acer/Desktop/sevaSetu/backend-sevaSetu";
require("dotenv").config({ path: path.join(backendPath, ".env") });
const mongoose = require(path.join(backendPath, "node_modules", "mongoose"));

// Load all models from backend
const User = require(path.join(backendPath, "model", "userModel"));
const Provider = require(path.join(backendPath, "model", "providerModel"));
const Admin = require(path.join(backendPath, "model", "adminModel"));
const SuperAdmin = require(path.join(backendPath, "model", "superAdminModel"));
const Booking = require(path.join(backendPath, "model", "bookingModel"));
const Complaint = require(path.join(backendPath, "model", "complaintModel"));
const Review = require(path.join(backendPath, "model", "reviewModel"));
const Category = require(path.join(backendPath, "model", "categoryModel"));
const Service = require(path.join(backendPath, "model", "serviceModel"));
const ProviderService = require(path.join(backendPath, "model", "providerServicModel"));

async function testCascade() {
  console.log("Connecting to DB...");
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected successfully.");

  // Create temporary/test data
  console.log("\n--- Creating Test Data ---");
  const testCategory = await Category.create({
    name: "test-category-" + Date.now(),
    description: "Temporary category for cascade test",
    createdBy: new mongoose.Types.ObjectId(),
  });

  const testService = await Service.create({
    category: testCategory._id,
    serviceName: "Test Service",
    description: "Temporary service for cascade test",
    basePrice: 100,
    estimatedDuration: 30,
    createdBy: new mongoose.Types.ObjectId(),
  });

  // Create mock User who is a provider
  const userProvider = await User.create({
    firstName: "Test",
    lastName: "Provider",
    email: "testprovider_" + Date.now() + "@example.com",
    phone: "12345678" + Math.floor(10 + Math.random() * 90),
    role: "provider",
    password: "hashedpassword",
  });

  const provider = await Provider.create({
    user: userProvider._id,
    category: testCategory._id,
    businessName: "Test Business",
  });

  // Create mock User who is a customer
  const userCustomer = await User.create({
    firstName: "Test",
    lastName: "Customer",
    email: "testcustomer_" + Date.now() + "@example.com",
    phone: "98765432" + Math.floor(10 + Math.random() * 90),
    role: "user",
    password: "hashedpassword",
  });

  // Create a Booking
  const booking = await Booking.create({
    bookingNumber: "BK-TEST-" + Date.now(),
    customer: userCustomer._id,
    provider: provider._id,
    service: testService._id,
    address: "123 Test St",
    city: "TestCity",
    state: "TestState",
    pincode: "123456",
    bookingDate: new Date(),
    bookingTime: "10:00 AM",
    amount: 100,
  });

  // Create Review and Complaint
  const review = await Review.create({
    booking: booking._id,
    customer: userCustomer._id,
    provider: provider._id,
    rating: 5,
    review: "Excellent!",
  });

  const complaint = await Complaint.create({
    booking: booking._id,
    customer: userCustomer._id,
    provider: provider._id,
    issue: "Some minor issue",
  });

  console.log("Mock data created:");
  console.log(`User (Provider) ID: ${userProvider._id}`);
  console.log(`Provider ID: ${provider._id}`);
  console.log(`User (Customer) ID: ${userCustomer._id}`);
  console.log(`Booking ID: ${booking._id}`);
  console.log(`Review ID: ${review._id}`);
  console.log(`Complaint ID: ${complaint._id}`);

  // 1. Verify Soft Delete Cascade
  console.log("\n--- Testing Soft Delete Cascade ---");
  console.log("Soft deleting User (Provider)...");
  await User.findByIdAndUpdate(userProvider._id, { isDeleted: true, status: "inactive" });

  const updatedProvider = await Provider.findById(provider._id);
  const updatedBooking = await Booking.findById(booking._id);
  const updatedReview = await Review.findById(review._id);

  console.log(`Provider isDeleted: ${updatedProvider.isDeleted}`);
  console.log(`Booking isDeleted: ${updatedBooking.isDeleted}`);
  console.log(`Review isDeleted: ${updatedReview.isDeleted}`);

  if (updatedProvider.isDeleted && updatedBooking.isDeleted && updatedReview.isDeleted) {
    console.log("SUCCESS: Soft delete cascaded correctly!");
  } else {
    console.error("FAIL: Soft delete did not cascade correctly!");
  }

  // 2. Verify Restore Cascade
  console.log("\n--- Testing Restore Cascade ---");
  console.log("Restoring User (Provider)...");
  await User.findByIdAndUpdate(userProvider._id, { isDeleted: false, status: "active" });

  const restoredProvider = await Provider.findById(provider._id);
  const restoredBooking = await Booking.findById(booking._id);
  const restoredReview = await Review.findById(review._id);

  console.log(`Provider isDeleted: ${restoredProvider.isDeleted}`);
  console.log(`Booking isDeleted: ${restoredBooking.isDeleted}`);
  console.log(`Review isDeleted: ${restoredReview.isDeleted}`);

  if (!restoredProvider.isDeleted && !restoredBooking.isDeleted && !restoredReview.isDeleted) {
    console.log("SUCCESS: Restore cascaded correctly!");
  } else {
    console.error("FAIL: Restore did not cascade correctly!");
  }

  // 3. Verify Hard Delete Cascade
  console.log("\n--- Testing Hard Delete Cascade ---");
  console.log("Hard deleting User (Customer)...");
  // Customer hard delete should delete booking, reviews, complaints where customer is userCustomer
  await User.findByIdAndDelete(userCustomer._id);

  const deletedCustomerBooking = await Booking.findById(booking._id);
  const deletedCustomerReview = await Review.findById(review._id);
  const deletedCustomerComplaint = await Complaint.findById(complaint._id);

  console.log(`Booking still exists? ${!!deletedCustomerBooking}`);
  console.log(`Review still exists? ${!!deletedCustomerReview}`);
  console.log(`Complaint still exists? ${!!deletedCustomerComplaint}`);

  if (!deletedCustomerBooking && !deletedCustomerReview && !deletedCustomerComplaint) {
    console.log("SUCCESS: Hard delete cascaded correctly!");
  } else {
    console.error("FAIL: Hard delete did not cascade correctly!");
  }

  // Cleanup remaining records
  console.log("\nCleaning up remaining test data...");
  await User.findByIdAndDelete(userProvider._id);
  await Provider.findByIdAndDelete(provider._id);
  await Category.findByIdAndDelete(testCategory._id);
  await Service.findByIdAndDelete(testService._id);
  console.log("Cleanup done.");
}

testCascade()
  .then(() => {
    console.log("Test execution finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
