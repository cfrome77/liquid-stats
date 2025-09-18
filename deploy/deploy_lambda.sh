#!/bin/bash
set -Eeuo pipefail
trap 'echo "❌ Script failed at line $LINENO. Exiting."' ERR

# --- Resolve script and project directories ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOP_DIR="$SCRIPT_DIR/.."
TF_DIR="$SCRIPT_DIR/terraform"

# --- Load environment variables from project root ---
set -a
source "$TOP_DIR/.env"
set +a

echo "🌍 Use AWS: $USE_AWS"
echo "📦 Lambda ZIP file: $LAMBDA_ZIP_FILE"

# --- Build Lambda ZIP ---
if [[ "$USE_AWS" == "true" ]]; then
    echo "⚙️  Creating virtual environment..."
    python3 -m venv "$TOP_DIR/venv"
    source "$TOP_DIR/venv/bin/activate"

    echo "📦 Installing dependencies..."
    pip install -r "$TOP_DIR/lambda/requirements.txt"

    echo "📦 Creating Lambda ZIP package..."
    TEMP_DIR=$(mktemp -d)
    SITE_PACKAGES_DIR="$TOP_DIR/venv/lib/python3.10/site-packages"

    cp "$TOP_DIR/lambda/fetch_api_data.py" "$TEMP_DIR"

    for dir in "$SITE_PACKAGES_DIR"/*; do
        name=$(basename "$dir")
        [[ "$name" =~ ^(pip|setuptools|__pycache__)$ ]] && continue
        cp -r "$dir" "$TEMP_DIR/"
    done

    cd "$TEMP_DIR"
    zip -r "$TOP_DIR/$LAMBDA_ZIP_FILE" ./*
    cd "$TOP_DIR"

    rm -rf "$TEMP_DIR"
    deactivate
fi

# Convert to TF list: ["http://localhost:4200","https://your-site.com"]
TF_CORS_ORIGINS=$(printf '"%s",' $(echo $ALLOWED_CORS_ORIGINS | tr ',' ' ')) 
# Remove trailing comma
TF_CORS_ORIGINS="[${TF_CORS_ORIGINS%,}]"

# --- Generate terraform.auto.tfvars dynamically ---
TFVARS_FILE="$TF_DIR/terraform.auto.tfvars"
cat > "$TFVARS_FILE" <<EOF
client_id        = "$CLIENT_ID"
client_secret    = "$CLIENT_SECRET"
untappd_username = "$UNTAPPD_USERNAME"
use_aws          =  $USE_AWS
lambda_zip_file  = "$TOP_DIR/$LAMBDA_ZIP_FILE"
allowed_cors_origins = $TF_CORS_ORIGINS
EOF

echo "📝 Generated $TFVARS_FILE"

# --- Terraform deployment ---
cd "$TF_DIR"
terraform init -input=false

echo "📝 Generating Terraform plan..."
terraform plan -out=tfplan

echo "🚀 Applying Terraform plan..."
terraform apply -auto-approve tfplan

cd "$TOP_DIR"
echo "✅ AWS deployment completed successfully."
