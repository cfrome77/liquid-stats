# Liquid Stats

This project uses the Untappd API and allows you to keep track of what beers you have had, your top-rated beers, badges you earned, and statistics about your Untappd check-ins.

[![Netlify Status](https://api.netlify.com/api/v1/badges/e8ebaf8a-2969-42fe-845e-4ae2bd422444/deploy-status)](https://app.netlify.com/projects/liquid-stats/deploys)

The Untappd API requires that you register your application. Register your app [here](https://untappd.com/api/register?register=new). Currently, new apps cannot be created to get API access. Most likely, you will need to be an insider to gain the ability to download your Untappd JSON data.

The local or AWS steps can be used for testing or production, just know that the data will need to be updated manually if you go with local JSON files vs the use of the AWS automation.

### Local fixture data

When no S3 bucket is configured, the app reads its JSON from the committed
fixtures in [`src/assets/data/`](src/assets/data). These stand in for the S3
objects during development and for the unmocked e2e tests, so they are a small
curated set rather than a dump of real data: they deliberately include a beer
with no label, a check-in with a user photo and one without, non-ASCII and
over-long names, and several countries and breweries.

Because the app reads some fields without guarding them (for example the map
and beer-history pages assume every beer has a brewery location), keep the
shape of these files intact when editing them. `e2e/fixture-integrity.spec.ts`
checks the structure, cross-file consistency, and the edge cases above, and
fails if any of them disappear.

To point development at your own data, edit the git-ignored
`src/environments/environment.local.ts` (created for you on first run) and set
`DATA_URL` to your data source. `npm run start:dev` and friends create that file
from committed defaults when it is missing, so a fresh checkout runs without
extra setup.

---

## Prerequisites

| Tool / Package      | Required Version | Purpose                         |
| ------------------- | ---------------- | ------------------------------- |
| Node.js             | >=v22.0.0        | Runtime for Angular and scripts |
| npm                 | >=v9.0.0         | Package manager                 |
| Angular CLI         | v21.2.x          | Building and serving the app    |
| Python              | 3.x              | Fetching Untappd data           |
| pip / python-dotenv | Latest           | Python dependency management    |
| Terraform           | v1.6.x           | Deploying AWS infrastructure    |

**Note:** We recommend using [NVM (Node Version Manager)](https://github.com/nvm/nvm) to manage Node versions. This allows you to easily switch to the supported Node version for this project:

```bash
nvm install 22
nvm use 22
```

Check your installed versions with:

```bash
node -v
npm -v
ng version
python --version
pip list
terraform -version
```

---

## Usage (Local)

1. Create a `.env` file:

```bash
cp .env.example .env
```

Fill in your `client_secret`, `client_id`, and `untappd username`. These variables will be read by [`lambda/fetch_api_data.py`](lambda/fetch_api_data.py).

2. Install Python dependencies:

```bash
pip install -r lambda/requirements.txt
```

3. Fetch Untappd data locally:

```bash
python lambda/fetch_api_data.py
```

4. Install Node dependencies:

```bash
npm install
```

5. Start the dev environment:

```bash
npm run start:dev
```

Your Angular app will be available at [http://localhost:4200](http://localhost:4200).

---

## Usage (AWS)

1. Create a `.env` file:

```bash
cp .env.example .env
```

Fill in variables for Untappd (`CLIENT_ID`, `CLIENT_SECRET`, `UNTAPPD_USERNAME`) and AWS (`S3_BUCKET_NAME`, `LAMBDA_ZIP_FILE`, `ALLOWED_CORS_ORIGINS`, `DATA_URL`).

2. Deploy AWS resources with Terraform:

```bash
cd deploy/terraform
terraform init
terraform apply
```

> Terraform will create the necessary S3 bucket, IAM roles, and other resources. You can review the planned changes before applying.

3. Use the deployment script in `deploy/` to build and upload the Lambda code:

```bash
cd deploy
./deploy_lambda.sh
```

This script builds the Lambda zip from `lambda/`, uploads it to S3, and runs Terraform to deploy the Lambda and schedule it to run (default: 12:00 AM Monday) to fetch Untappd data.

4. Once deployed, you can:

- Run `lambda/fetch_api_data.py` locally to update your local JSON copies.
- Deploy the Angular app to your server; it will fetch the data from S3 according to the Lambda schedule.

---

## Terraform Notes

- All Terraform files are in `deploy/terraform/`.
- Only sensitive or generated files are ignored (`terraform.auto.tfvars`, `.tfplan`, `.tfstate`, `.terraform/`).
- Core configuration files (`main.tf`, `provider.tf`, `outputs.tf`, `variables.tf`, `.terraform.lock.hcl`) are tracked in Git.
- `.terraform.lock.hcl` ensures consistent provider versions across environments.

---

## Authors

**Chris Frome** - [linkedin.com/in/cfrome77](https://www.linkedin.com/in/cfrome77)
