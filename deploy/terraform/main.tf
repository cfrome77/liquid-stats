# Generate a unique suffix for cross-account uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# --- Always create bucket ---
resource "aws_s3_bucket" "this" {
  bucket = "liquid-stats-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "liquid-stats"
    Environment = "dev"
  }
}

# --- Enforce ownership ---
resource "aws_s3_bucket_ownership_controls" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# --- Default: block public access (but allow policy exceptions) ---
resource "aws_s3_bucket_public_access_block" "this" {
  bucket                 = aws_s3_bucket.this.id
  block_public_acls       = true
  block_public_policy     = false # allow policy exceptions
  ignore_public_acls      = true
  restrict_public_buckets = false
}

# --- Bucket policy: allow only the JSONs public read ---
resource "aws_s3_bucket_policy" "public_jsons" {
  bucket = aws_s3_bucket.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "BadgesPublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "arn:aws:s3:::${aws_s3_bucket.this.bucket}/badges.json"
      },
      {
        Sid       = "BeersPublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "arn:aws:s3:::${aws_s3_bucket.this.bucket}/beers.json"
      },
      {
        Sid       = "CheckinsPublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "arn:aws:s3:::${aws_s3_bucket.this.bucket}/checkins.json"
      },
      {
        Sid       = "WishlistPublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "arn:aws:s3:::${aws_s3_bucket.this.bucket}/wishlist.json"
      }
    ]
  })
}

# --- CORS config for browser access ---
resource "aws_s3_bucket_cors_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  dynamic "cors_rule" {
    for_each = var.allowed_cors_origins
    content {
      allowed_methods = ["GET"]
      allowed_origins = var.allowed_cors_origins
      allowed_headers = ["*"]
    }
  }
}

# --- IAM Role ---
resource "aws_iam_role" "lambda_execution" {
  name = "LambdaExecutionRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_s3" {
  name = "lambda_s3_policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["s3:GetObject","s3:PutObject"]
      Effect   = "Allow"
      Resource = "arn:aws:s3:::${aws_s3_bucket.this.bucket}/*"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_logs" {
  name = "lambda_cloudwatch_policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

# --- Lambda Function ---
resource "aws_lambda_function" "fetch_api_data" {
  function_name = "liquid-stats-lambda"
  handler       = "fetch_api_data.lambda_handler"
  runtime       = "python3.12"
  memory_size   = 128
  timeout       = 60
  role          = aws_iam_role.lambda_execution.arn

  filename         = var.lambda_zip_file
  source_code_hash = filebase64sha256(var.lambda_zip_file)

  environment {
    variables = {
      CLIENT_ID        = var.client_id
      CLIENT_SECRET    = var.client_secret
      S3_BUCKET_NAME   = aws_s3_bucket.this.bucket
      UNTAPPD_USERNAME = var.untappd_username
      USE_AWS          = "true"
    }
  }
}

# --- EventBridge Schedule ---
resource "aws_cloudwatch_event_rule" "lambda_schedule" {
  name                = "fetch_api_data_schedule"
  schedule_expression = "cron(0 0 ? * MON *)"
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.lambda_schedule.name
  target_id = "fetch_api_data"
  arn       = aws_lambda_function.fetch_api_data.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fetch_api_data.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_schedule.arn
}