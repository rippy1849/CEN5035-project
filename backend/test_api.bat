@echo off
echo Testing Create Listing...
curl -X POST http://localhost:8080/listings -H "Content-Type: application/json" -d "{\"user_id\": 1, \"title\": \"Laptop\", \"description\": \"Good condition\", \"price\": 500.0, \"category\": \"Electronics\"}"
echo.
echo.

echo Testing Get Listings Again...
curl http://localhost:8080/listings
echo.
