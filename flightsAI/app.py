from flask import Flask, render_template, jsonify, request
from amadeus import Client, ResponseError, Location
from config import AMADEUS_API_KEY, AMADEUS_API_SECRET

app = Flask(__name__)

# Initialize Amadeus client
amadeus = Client(
    client_id=AMADEUS_API_KEY,
    client_secret=AMADEUS_API_SECRET
)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search_flights', methods=['POST'])
def search_flights():
    try:
        data = request.json
        origin = data.get('origin')
        destination = data.get('destination')
        departure_date = data.get('departureDate')
        return_date = data.get('returnDate')
        adults = int(data.get('passengers', 1))

        # Validate inputs
        if not all([origin, destination, departure_date]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Ensure IATA codes are 3 letters
        if len(origin) != 3 or len(destination) != 3:
            return jsonify({'error': 'Origin and destination must be 3-letter IATA codes'}), 400

        # Fetch departure flights
        departure_flights = amadeus.shopping.flight_offers_search.get(
            originLocationCode=origin,
            destinationLocationCode=destination,
            departureDate=departure_date,
            adults=adults,
            max=20,
            currencyCode="USD"
        ).data

        # Fetch return flights if return date is provided
        return_flights = []
        if return_date:
            return_flights = amadeus.shopping.flight_offers_search.get(
                originLocationCode=destination,
                destinationLocationCode=origin,
                departureDate=return_date,
                adults=adults,
                max=20,
                currencyCode="USD"
            ).data

        return jsonify({'departure_flights': departure_flights, 'return_flights': return_flights})
    except ResponseError as error:
        return jsonify({'error': str(error)}), 400
    except Exception as error:
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/autocomplete', methods=['GET'])
def autocomplete():
    query = request.args.get('query', '')
    try:
        response = amadeus.reference_data.locations.get(
            keyword=query,
            subType=Location.AIRPORT
        )
        return jsonify(response.data)
    except ResponseError as error:
        return jsonify({'error': str(error)}), 400

if __name__ == '__main__':
    app.run(debug=True)
