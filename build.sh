#!/bin/bash

# set s3 bucket name
S3_BUCKET="liquid-stats"

cd lambda

# Install the requirements
pip install --target ./package -r requirements.txt

# Zip the pkackage directory and python script
cd package
zip -r ../../liquid-stats-lambda.zip .
cd ../
zip -g ../liquid-stats-lambda.zip fectch_api_data.py
cd ../
# Put zip in S3 repository
aws s3 --region us-east-1 cp liquid-stats-lambda.zip s3://${S3_BUCKET}