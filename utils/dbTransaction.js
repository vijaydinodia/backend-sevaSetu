const mongoose = require("mongoose");

/**
 * Runs a set of operations within a transaction.
 * If the database environment does not support transactions (e.g. standalone MongoDB without a replica set),
 * it falls back to running the operations without a transaction.
 * @param {Function} operations - Async function that takes a session parameter: (session) => Promise<any>
 */
async function runWithTransaction(operations) {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await operations(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    if (session && typeof session.inTransaction === "function" && session.inTransaction()) {
      await session.abortTransaction();
    }
    const errMsg = err.message || "";
    const isNoReplicaSet =
      errMsg.includes("replica set") ||
      errMsg.includes("Transaction numbers") ||
      errMsg.includes("standalone") ||
      errMsg.includes("sessions are not supported") ||
      errMsg.includes("session");
      
    if (isNoReplicaSet) {
      return await operations(null);
    } else {
      throw err;
    }
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

module.exports = { runWithTransaction };
