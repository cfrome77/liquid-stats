output "lambda_arn" {
  value       = aws_lambda_function.fetch_api_data.arn
  description = "ARN of the Lambda function"
}

output "s3_bucket_name" {
  value       = "${aws_s3_bucket.this.bucket}"
  description = "S3 bucket name used for Lambda deployment"
}

output "s3_url" {
  value       = "https://${aws_s3_bucket.this.bucket}.s3.amazonaws.com/"
  description = "S3 bucket url used for fetching JSON files"
}

output "lambda_role_arn" {
  value       = aws_iam_role.lambda_execution.arn
  description = "IAM Role ARN for Lambda function"
}

output "eventbridge_rule_name" {
  value       = aws_cloudwatch_event_rule.lambda_schedule.name
  description = "Name of EventBridge rule triggering Lambda"
}
