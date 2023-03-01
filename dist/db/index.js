const AWS = require("aws-sdk");
AWS.config.update({
  region: "ap-south-1"
});
require("dotenv").config();
const docClient = new AWS.DynamoDB.DocumentClient({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY
  }
});
const DB = {
  async get(pk, sk, TableName) {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          TableName,
          Key: {
            pk,
            sk
          }
        };
        const data = await docClient.get(params).promise();
        resolve(data.Item);
      } catch (error) {
        reject({
          message: "There was an error while fetching data",
          error
        });
      }
    });
  },
  async queryBeginsWith(pk, sk, TableName) {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          TableName,
          KeyConditionExpression: "pk = :pk AND begins_with(sk,:starts)",
          ExpressionAttributeValues: {
            ":pk": pk,
            ":starts": sk
          }
        };
        const data = await docClient.query(params).promise();
        resolve(data.Items.reverse());
      } catch (error) {
        reject({
          message: "There was an error while fetching data",
          error
        });
      }
    });
  },
  async queryWithFilter(pk, sk, field, value, TableName) {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          TableName,
          KeyConditionExpression: "pk = :pk AND begins_with(sk,:starts)",
          FilterExpression: "#field = :value",
          ExpressionAttributeNames: {
            "#field": field
          },
          ExpressionAttributeValues: {
            ":pk": pk,
            ":starts": sk,
            ":value": value
          },
          ScanIndexForward: false
        };
        const data = await docClient.query(params).promise();
        resolve(data.Items);
      } catch (error) {
        reject({
          message: "There was an error while fetching data",
          error
        });
      }
    });
  },
  async queryWithUserIndex(sk, pk, TableName) {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          TableName,
          IndexName: "user-event-index",
          KeyConditionExpression: "#sk = :sk AND begins_with(pk,:starts)",
          ExpressionAttributeNames: {
            "#sk": "sk"
          },
          ExpressionAttributeValues: {
            ":sk": sk,
            ":starts": pk
          },
          ScanIndexForward: false
        };
        const data = await docClient.query(params).promise();
        resolve(data.Items);
      } catch (error) {
        reject({
          message: "There was an error while fetching data",
          error
        });
      }
    });
  },
  async put(data, TableName) {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          TableName,
          Item: data
        };
        const res = await docClient.put(params).promise();
        resolve(data);
      } catch (error) {
        reject({
          message: "There was an error while adding data",
          error
        });
      }
    });
  },
  // write async batch put function
  async batchWrite(data, TableName) {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          RequestItems: {
            [TableName]: data
          }
        };
        const res = await docClient.batchWrite(params).promise();
        resolve(data);
      } catch (error) {
        reject({
          message: "There was an error while adding data",
          error
        });
      }
    });
  },
  async delete(pk, sk, TableName) {
    return new Promise(async (resolve, reject) => {
      try {
        const params = {
          TableName,
          Key: {
            pk,
            sk
          }
        };
        const data = await docClient.delete(params).promise();
        resolve(data);
      } catch (error) {
        reject({
          message: "There was an error while deleting data",
          error
        });
      }
    });
  }
};
module.exports = DB;