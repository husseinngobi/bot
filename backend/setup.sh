#!/bin/bash

echo "🔧 Setting up Face Recognition Bot by Eng. Hussein Ngobi..."

# 1. Create required folders
mkdir -p uploads annotated face_db/staff

# 2. Install dependencies
echo "📦 Installing Python packages..."
pip install -r requirements.txt

# 3. Normalize image filenames in face_db/staff/
echo "🖼️ Normalizing staff images..."
cd face_db/staff
for f in *\ *; do
  [ -e "$f" ] || continue
  new_name=$(echo "$f" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')
  mv "$f" "$new_name"
done
cd ../../

# 4. Create metadata.json if missing
META_FILE="face_db/staff/metadata.json"
if [ ! -f "$META_FILE" ]; then
  echo "⚠️  No metadata.json found. Creating a sample one..."
  cat <<EOF > $META_FILE
{
  "my_face.jpg": {
    "name": "Eng. Hussein Ngobi",
    "title": "CEO & Founder",
    "authorized": true
  }
}
EOF
else
  echo "✅ metadata.json found!"
fi

echo "✅ Setup complete! Run the server with:"
echo "python app.py"
