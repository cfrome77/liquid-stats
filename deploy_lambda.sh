#!/bin/bash

# Fail on error, undefined vars, or failed pipes
set -Eeuo pipefail
trap 'echo "❌ Script failed at line $LINENO. Exiting."' ERR

# Load environment variables from the .env file
set -a
source .env
set +a

# Ensure AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "❌ AWS CLI is not configured. Run 'aws configure' first."
  exit 1
fi

echo "📁 S3 bucket: $S3_BUCKET_NAME"
echo "📄 CloudFormation template: $CLOUDFORMATION_TEMPLATE"
echo "📦 ZIP file: $ZIP_FILE"

# Create and activate a virtual environment
echo "⚙️  Creating and activating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Package Python script and dependencies
echo "📦 Creating ZIP package..."

TOP_DIR="$(pwd)"
TEMP_DIR=$(mktemp -d)
SITE_PACKAGES_DIR="venv/lib/python3.10/site-packages"

cp fetch_api_data.py "$TEMP_DIR"

for dir in "$SITE_PACKAGES_DIR"/*; do
  name=$(basename "$dir")
  if [[ "$name" == pip* || "$name" == setuptools* || "$name" == "__pycache__" ]]; then
    continue
  fi
  cp -r "$dir" "$TEMP_DIR/"
done

cd "$TEMP_DIR"
zip -r "$TOP_DIR/$ZIP_FILE" ./*
cd "$TOP_DIR"

rm -rf "$TEMP_DIR"
deactivate

# Upload to S3
echo "☁️  Uploading package to S3..."
aws s3 cp "$ZIP_FILE" "s3://$S3_BUCKET_NAME/"

# CloudFormation deploy
STACK_NAME="liquid-stats-lambda-stack"
REGION="us-east-1"
CAPABILITIES="CAPABILITY_NAMED_IAM"

echo "🔍 Checking CloudFormation stack status..."

# Get stack status
STACK_STATUS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].StackStatus" \
  --output text 2>/dev/null || true)

if [[ -z "$STACK_STATUS" ]]; then
  STACK_STATUS="STACK_DOES_NOT_EXIST"
fi

# Handle edge cases
if [[ "$STACK_STATUS" == "REVIEW_IN_PROGRESS" ]]; then
  echo "⚠️  Stack is stuck in REVIEW_IN_PROGRESS. Deleting and recreating it..."
  aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$REGION"
  echo "⏳ Waiting for stack to be deleted..."
  aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$REGION"
  echo "✅ Stack deleted. Proceeding with fresh deployment."
elif [[ "$STACK_STATUS" == "STACK_DOES_NOT_EXIST" ]]; then
  echo "ℹ️  Stack does not exist. It will be created."
else
  echo "ℹ️  Stack exists with status: $STACK_STATUS"
fi

echo "🚀 Deploying CloudFormation stack..."

DEPLOY_OUTPUT=$(aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$CLOUDFORMATION_TEMPLATE" \
  --capabilities "$CAPABILITIES" \
  --region "$REGION" \
  --parameter-overrides \
    S3BucketName="$S3_BUCKET_NAME" \
    S3Key="$ZIP_FILE" \
    ClientId="$CLIENT_ID" \
    ClientSecret="$CLIENT_SECRET" \
    Username="$UNTAPPD_USERNAME" \
    Environment="aws" \
  --no-fail-on-empty-changeset 2>&1) || {
    echo "❌ Deployment failed!"
    echo "$DEPLOY_OUTPUT"
    exit 1
}

# Output the deployment result
echo "$DEPLOY_OUTPUT"
echo "✅ CloudFormation deployment completed successfully."