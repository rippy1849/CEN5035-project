@echo off
echo Testing Create Listing...
curl -X POST http://localhost:8080/listings -H "Content-Type: application/json" -d "{\"user_id\": 1, \"title\": \"Laptop\", \"description\": \"Good condition\", \"price\": 500.0, \"category\": \"Electronics\"}"
echo.
echo.

echo Testing Get Listings...
curl http://localhost:8080/listings
echo.
echo.

echo Testing Update Listing...
curl -X PUT http://localhost:8080/listings/1 -H "Content-Type: application/json" -d "{\"title\": \"Laptop Pro\", \"description\": \"Excellent condition\", \"price\": 550.0, \"category\": \"Electronics\"}"
echo.
echo.

echo Testing Get Listings Again...
curl http://localhost:8080/listings
echo.
