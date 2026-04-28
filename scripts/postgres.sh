#!/bin/bash
set -e

SERVER="endur-client-db"
USER="postgres"
PW="postgres"
DB="endur_client"

echo "Stopping/removing old docker [$SERVER] and starting a fresh instance"
(docker kill $SERVER || :) && \
  (docker rm $SERVER || :) && \
  docker run --name $SERVER \
  -e POSTGRES_USER=$USER \
  -e POSTGRES_PASSWORD=$PW \
  -p 5432:5432 \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -d postgres

echo "Waiting for postgres [$SERVER] to start"
sleep 10

echo "Creating database [$DB]"
docker exec $SERVER psql -U postgres -c "CREATE DATABASE $DB;"
echo "\l" | docker exec -i $SERVER psql -U postgres

# Disable SSL requirement for all databases (match troves-client-v2 behavior)
docker exec $SERVER psql -U postgres -c "ALTER SYSTEM SET ssl = off;"
docker exec $SERVER psql -U postgres -c "ALTER SYSTEM SET ssl_cert_file = '';"
docker exec $SERVER psql -U postgres -c "ALTER SYSTEM SET ssl_key_file = '';"

docker restart $SERVER
sleep 5

echo "Postgres ready. Suggested DATABASE_URL:"
echo "postgresql://$USER:$PW@localhost:5432/$DB?schema=public"

