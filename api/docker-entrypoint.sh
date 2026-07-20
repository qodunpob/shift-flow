#!/bin/sh
set -e

echo "Running database migrations..."
node ./node_modules/typeorm/cli.js migration:run -d dist/datasource.js

if [ "${SEED:-false}" = "true" ]; then
  echo "Seeding database..."
  node dist/seeds/seed.js
fi

echo "Starting API..."
exec node dist/src/main.js
