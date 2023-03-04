module.exports = {
  apps: [
    {
      name: "milan-api",
      script: "./dist/index.js", // your script
      args: "start",
      env: {
        JWT_SECRET="milan-backend_jwt-secret_key",
	TABLE_NAME="milan-db",
	TABLE_REGION="ap-south-1",
	ACCESS_KEY="AKIAUWH5CEVSAQFZBRVD",
	SECRET_KEY="wi0rnOhTtSIai9rlMZp/KurwKlBPIdsPsZ/rpbYz",
	TICKET_PAYLOAD_TOKEN="sRmIsT MiLaN TwOzErOzErOtHrEe",
	EARLY_BIRD_LIMIT="3000",
	BUCKET_NAME="milan-23-qr"
      },
    },
  ],
};
