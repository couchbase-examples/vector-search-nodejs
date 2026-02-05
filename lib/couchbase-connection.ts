import { connect, Cluster } from "couchbase";

export async function createCouchbaseCluster(): Promise<Cluster | void> {
  const connectionString = process.env.DB_CONN_STR;
  const databaseUsername = process.env.DB_USERNAME;
  const databasePassword = process.env.DB_PASSWORD;

  if (!databaseUsername) {
    throw new Error(
      "Please define the DB_USERNAME environment variable inside .env"
    );
  }

  if (!databasePassword) {
    throw new Error(
      "Please define the DB_PASSWORD environment variable inside .env"
    );
  }

  if (!connectionString) {
    throw new Error(
      "Please define the DB_CONN_STR environment variable inside .env"
    );
  }

  try {
    return await connect(connectionString, {
      username: databaseUsername,
      password: databasePassword,
      configProfile: "wanDevelopment",
    });
  } catch (e) {
    throw new Error(
      `Could not connect to the Couchbase cluster. Please check your DB_CONN_STR, DB_USERNAME, and DB_PASSWORD environment variables. \n${e}`,
    )
  }

}
