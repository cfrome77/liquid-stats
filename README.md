# Liquid Stats

This project uses the Untappd API and allows you to keep track of what beers you have had, your top-rated beers, badges you earned, and statistics about your Untappd check-ins.

[![Netlify Status](https://api.netlify.com/api/v1/badges/e8ebaf8a-2969-42fe-845e-4ae2bd422444/deploy-status)](https://app.netlify.com/projects/liquid-stats/deploys)

The Untappd API requires that you register your application. Register your app [here](https://untappd.com/api/register?register=new). Currently, new apps cannot be created to get API access. Most likely, you will need to be an insider to gain the ability to download your Untappd JSON data.

---

## Prerequisites

| Tool / Package      | Required Version | Purpose |
|--------------------|-----------------|---------|
| Node.js             | v16.x           | Runtime for Angular and scripts |
| npm                 | v8.x            | Package manager |
| Angular CLI         | v14.x           | Building and serving the app |
| Python              | 3.x             | Fetching Untappd data |
| pip / python-dotenv | Latest          | Python dependency management |

**Note:** We recommend using [NVM (Node Version Manager)](https://github.com/nvm-sh/nvm) to manage Node versions. This allows you to easily switch to Node 16 for this project:

```bash
nvm install 20
nvm use 20
```

Check your installed versions with:

```bash
node -v
npm -v
ng version
python --version
pip list
```

## Usage (local)

1 - run the following command to create a .env file: `cp .env.example .env`. Fill in the variables in the `.env` file with your `client_secret`, `client_id`, and `untappd username`. These variable will be read and used by the [`fetch_api_data.py`](fetch_api_data.py) file.

2 - The [`fetch_api_data.py`](fetch_api_data.py) script is used to fetch the data from the api and store it into local copies for faster retreval and to work around Untapp's 100 request per hour limit. [`fetch_api_data.py`](fetch_api_data.py) requires the `requests`, and `dotenv` packages to be installed using `pip` before any data can be pulled or an error will occur. To fetch the data run `python fetch_api_data.py`.

3 - In your terminal, run the command `npm install` to install the dependencies of the project.

4 - In your terminal, run the command `npm run start:dev` to create the dev envionment variables file and build and load the application for viewing at `localhost:4200`.

## Usage (AWS)

1 - run the following command to create a .env file: `cp .env.example .env`. Fill in the variables in the `.env` file with your variable for Untappd (`client_secret`, `client_id`, and `untappd username`) and the ones for AWS (`CLOUDFORMATION_TEMPLATE`, `S3_BUCKET_NAME`, `STACK_NAME`, and `LAMBDA_ZIP_FILE`). These variable will be read and used by the [`fetch_api_data.py`](fetch_api_data.py) and [`liquid-stats-lambda.json`](liquid-stats-lambda.json) files.

2 - Use the [`liquid-stats-lambda.sh`](liquid-stats-lambda.sh) file to deploy the needed resources to AWS for automating the retrevial of the Untappd data. The script will build the Lambda code zip that and upload it to S3. It will also deploy the ClouFormation template that creates the Lambda function using the uplodaed zip file and createds the needed permissions and resources to run the lambda on a schedule (cron).

2 - The [`fetch_api_data.py`](fetch_api_data.py) script in Lambda will run the code using the created trigger 12:00 AM, on Monday to fetch the data from the Untappd API and store it into the correct bucket (directory) in S3 for faster retreval and to work around Untapp's 100 request per hour limit. All required packages for the Python code to work are part of the zip that is deployed to Lambda.

3 - Once all resources are created in S3 you will be able to run the code locally as noted above or deploy the Angular app to your favorite server, fethcing (upadting) the data on the specified schedule.

## Authors

**Chris Frome** - [linkedin.com/in/cfrome77](https://www.linkedin.com/in/cfrome77)
