#!/bin/bash
set -Eeuo pipefail
trap 'echo "❌ Script failed at line $LINENO. Exiting."' ERR

# -----------------------------------------------------------------------------
# Paths
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOP_DIR="$SCRIPT_DIR/.."
TF_DIR="$SCRIPT_DIR/terraform"

# -----------------------------------------------------------------------------
# Load env vars
# -----------------------------------------------------------------------------
set -a
source "$TOP_DIR/.env"
set +a

echo "🌍 Use AWS: $USE_AWS"
echo "📦 Lambda ZIP file: $LAMBDA_ZIP_FILE"

# -----------------------------------------------------------------------------
# Lambda build
# -----------------------------------------------------------------------------
if [[ "$USE_AWS" == "true" ]]; then

    echo "🧹 Cleaning old artifacts..."
    rm -f "$TOP_DIR/$LAMBDA_ZIP_FILE"

    TEMP_DIR=$(mktemp -d)
    BUILD_DIR="$TEMP_DIR/build"

    mkdir -p "$BUILD_DIR"

    echo "🐍 Creating isolated build venv..."
    python3 -m venv "$TEMP_DIR/venv"
    source "$TEMP_DIR/venv/bin/activate"

    pip install --upgrade pip >/dev/null 2>&1

    echo "📦 Installing Lambda dependencies into build folder..."
    pip install \
        --no-cache-dir \
        -r "$TOP_DIR/lambda/requirements.txt" \
        -t "$BUILD_DIR"

    echo "📄 Copying Lambda source..."
    cp "$TOP_DIR/lambda/fetch_api_data.py" "$BUILD_DIR"

    echo "🧹 Cleaning Python artifacts..."
    find "$BUILD_DIR" -type d -name "__pycache__" -exec rm -rf {} + || true
    find "$BUILD_DIR" -type f -name "*.pyc" -delete || true
    find "$BUILD_DIR" -type d \( \
        -name "tests" \
        -o -name "test" \
        -o -name "pip*" \
        -o -name "setuptools*" \
        -o -name "wheel*" \
        -o -name "pkg_resources*" \
        -o -name "_distutils_hack*" \
    \) -exec rm -rf {} + || true

    echo "🗜️ Zipping Lambda package..."
    (
        cd "$BUILD_DIR"
        zip -qr "$TOP_DIR/$LAMBDA_ZIP_FILE" .
    )

    echo "🧹 Cleaning temp directory..."
    deactivate || true
    rm -rf "$TEMP_DIR"

    echo "✅ Lambda package created:"
    echo "   $TOP_DIR/$LAMBDA_ZIP_FILE"
fi

# -----------------------------------------------------------------------------
# Terraform vars
# -----------------------------------------------------------------------------
TF_CORS_ORIGINS=$(
    printf '"%s",' $(echo "$ALLOWED_CORS_ORIGINS" | tr ',' ' ')
)
TF_CORS_ORIGINS="[${TF_CORS_ORIGINS%,}]"

TFVARS_FILE="$TF_DIR/terraform.auto.tfvars"

cat > "$TFVARS_FILE" <<EOF
client_id             = "$CLIENT_ID"
client_secret         = "$CLIENT_SECRET"
untappd_username      = "$UNTAPPD_USERNAME"
use_aws               = $USE_AWS
lambda_zip_file       = "$TOP_DIR/$LAMBDA_ZIP_FILE"
allowed_cors_origins  = $TF_CORS_ORIGINS
EOF

echo "📝 Generated $TFVARS_FILE"

# -----------------------------------------------------------------------------
# Terraform deploy (backend unchanged)
# -----------------------------------------------------------------------------
cd "$TF_DIR"

echo "⚙️ Initializing Terraform..."

# IMPORTANT:
# Backend has NOT changed -> no migrate/reconfigure needed
terraform init -input=false

echo "📝 Generating Terraform plan..."
terraform plan -out=tfplan

echo "🚀 Applying Terraform plan..."
terraform apply -auto-approve tfplan

cd "$TOP_DIR"

echo "✅ AWS deployment completed successfully."