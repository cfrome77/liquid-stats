variable "client_id" {
  type        = string
  description = "Client ID for the external API"
}

variable "client_secret" {
  type        = string
  description = "Client Secret for the external API"
  sensitive   = true
}

variable "untappd_username" {
  type        = string
  description = "Username for the application"
}

variable "use_aws" {
  type        = bool
  description = "if the data should come from local files or from AWS S3"
}

variable "lambda_zip_file" {
  type        = string
  description = "Path to the Lambda zip file"
}

variable "s3_bucket_name" {
  type        = string
  description = "S3 bucket name for Lambda code"
}

variable "region" {
  type        = string
  default     = "us-east-1"
}
