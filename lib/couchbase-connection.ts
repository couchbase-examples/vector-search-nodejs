import * as couchbase from "couchbase"

const connectionString = process.env.DB_CONN_STR || "localhost";
const databaseUsername = process.env.DB_USERNAME;
const databasePassword = process.env.DB_PASSWORD;

if (!databaseUsername) {
  throw new Error(
    "Please define the DB_USERNAME environment variable inside .env.local"
  )
}

if (!databasePassword) {
  throw new Error(
    "Please define the DB_PASSWORD environment variable inside .env.local"
  )
}

if (!connectionString) {
  throw new Error(
    "Please define the DB_CONN_STR environment variable inside .env.local"
  )
}

export async function createCouchbaseCluster(): Promise<couchbase.Cluster> {
  const cluster = await couchbase.connect(connectionString, {
    username: databaseUsername,
    password: databasePassword,
    configProfile: "wanDevelopment",
  })

  return cluster
}
