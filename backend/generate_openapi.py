import json
from app.main import app

# Generate OpenAPI schema
openapi_schema = app.openapi()

# Save to frontend directory
with open('../frontend/openapi.json', 'w', encoding='utf-8') as f:
    json.dump(openapi_schema, f, indent=2)

print("OpenAPI schema generated successfully!")
