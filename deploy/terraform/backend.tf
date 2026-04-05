terraform {
  backend "s3" {
    bucket         = "liquid-stats-terraform-state"
    key            = "liquid-stats/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}