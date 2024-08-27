# SurveyGenie API

### This is the backend API for the SurveyGenie application. Follow these steps to set up the project on your local machine.

### Prerequisites

- Node.js (version 14 or later)
- PostgreSQL (version 12 or later)
- Git

### Setup Instructions

1. Clone the Repository
   Start by cloning the repository to your local machine:

git clone <your-repo-url>
cd surveyGenie_api

2. Install Dependencies
   Install the necessary dependencies using npm:

`npm install`

3. Database Setup
   You’ll need to set up a PostgreSQL database for development and testing.

Run the following commands in your terminal to create the required databases:

- Set up the development database:

```bash
createdb survey_genie
```

- Set up the testing database:

```bash
createdb survey_genie_test
```

4. Environment Variables
   You will need to set up environment variables for the application to function correctly. Create a .env file in the root directory of the project with the following content:

   - SECRET_KEY="your-secret-key"
   - PORT=3001
   - Database URLs
   - May need to add

   - Example:
     - SECRET_KEY: A secret key used for cryptographic operations.
     - PORT: The port on which the API will run. Default is 3001.
     - TEST_DATABASE_URL: The connection string for your test database.

5. Running the API
   To start the server in development mode, run:

`npm run dev`

This will start the server on http://localhost:3001 (or the port you specified in your .env file).

6. Running Tests
   To run the test suite, use the following command:

`npm test`

This will use the TEST_DATABASE_URL to connect to your test database.

7. Configuration File Explanation
   The config.js file loads environment variables and sets up the configuration for the application:

- SECRET_KEY: This is loaded from your .env file or defaults to "secret-dev" for development.
- PORT: The port on which the server runs as specified or defaults to 3001.
- DATABASE_URL: The URL of the database used in production or testing.
- BCRYPT_WORK_FACTOR: A value determining the complexity of password hashing (set lower in test mode for speed).

This file uses dotenv to load variables from the .env file and includes logging to confirm the configuration when the application starts.

8. Common Issues
   - Database Connection: Ensure your PostgreSQL server is running and accessible with the credentials provided in the .env file.
   - Environment Variables: Ensure all required environment variables are correctly set in your .env file.
