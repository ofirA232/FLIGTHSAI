document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading spinner
        loadingDiv.classList.remove('hidden');
        resultsDiv.innerHTML = '';

        const searchData = {
            origin: document.getElementById('origin').value.toUpperCase(),
            destination: document.getElementById('destination').value.toUpperCase(),
            departureDate: document.getElementById('departureDate').value,
            returnDate: document.getElementById('returnDate').value,
            passengers: document.getElementById('passengers').value
        };

        try {
            const response = await fetch('/search_flights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch flights');
            }

            displayFlights(data);
        } catch (error) {
            resultsDiv.innerHTML = `
                <div class="col-span-full p-4 bg-red-100 text-red-700 rounded-md">
                    ${error.message}
                </div>
            `;
        } finally {
            loadingDiv.classList.add('hidden');
        }
    });

    function formatDuration(duration) {
        // Remove the "PT" prefix
        duration = duration.replace('PT', '');
        
        // Extract hours and minutes
        const hours = duration.match(/(\d+)H/)?.[1] || '0';
        const minutes = duration.match(/(\d+)M/)?.[1] || '0';
        
        // Format the duration string
        if (hours === '0') {
            return `${minutes}min`;
        } else if (minutes === '0') {
            return `${hours}h`;
        } else {
            return `${hours}h ${minutes}min`;
        }
    }

    function displayFlights(data) {
        // Check if data exists and has the expected structure
        if (!data || (!data.departure_flights && !data.return_flights)) {
            resultsDiv.innerHTML = `
                <div class="col-span-full p-4 bg-red-100 text-red-700 rounded-md">
                    No flights found or invalid data received.
                </div>
            `;
            return;
        }

        const departure_flights = data.departure_flights || [];
        const return_flights = data.return_flights || [];

        // Clear previous results
        resultsDiv.innerHTML = '';

        // Create columns for departure and return flights
        const departureColumn = document.createElement('div');
        departureColumn.className = 'w-full md:w-1/2 p-2';
        const returnColumn = document.createElement('div');
        returnColumn.className = 'w-full md:w-1/2 p-2';

        // Add headers
        departureColumn.innerHTML = '<h2 class="text-2xl font-bold mb-4">Departure Flights</h2>';
        returnColumn.innerHTML = '<h2 class="text-2xl font-bold mb-4">Return Flights</h2>';

        // Display departure flights
        if (!departure_flights.length) {
            departureColumn.innerHTML += `
                <div class="p-4 bg-yellow-100 text-yellow-700 rounded-md">
                    No departure flights found for your search criteria.
                </div>
            `;
        } else {
            try {
                departureColumn.innerHTML += departure_flights.map(flight => {
                    try {
                        const offer = flight.itineraries[0];
                        const segment = offer.segments[0];
                        const price = flight.price.total;
                        
                        return `
                            <div class="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow">
                                <div class="flex justify-between items-center mb-4">
                                    <span class="text-lg font-semibold">${getCarrierName(segment.carrierCode)}</span>
                                    <span class="text-xl font-bold text-blue-600">$${parseFloat(price).toFixed(2)}</span>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <div>
                                            <div class="font-medium">${segment.departure.iataCode}</div>
                                            <div class="text-sm font-medium text-gray-700">${segment.departure.cityName || 'Airport'}</div>
                                            <div class="text-sm text-gray-500">${segment.departure.at.split('T')[1].substring(0, 5)}</div>
                                        </div>
                                        <div class="text-center text-gray-400 self-center">
                                            <div class="text-sm">✈️</div>
                                            <div class="text-xs">${formatDuration(segment.duration)}</div>
                                        </div>
                                        <div class="text-right">
                                            <div class="font-medium">${segment.arrival.iataCode}</div>
                                            <div class="text-sm font-medium text-gray-700">${segment.arrival.cityName || 'Airport'}</div>
                                            <div class="text-sm text-gray-500">${segment.arrival.at.split('T')[1].substring(0, 5)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    } catch (error) {
                        console.error('Error processing flight:', error);
                        return '';
                    }
                }).join('');
            } catch (error) {
                console.error('Error processing departure flights:', error);
                departureColumn.innerHTML += `
                    <div class="p-4 bg-red-100 text-red-700 rounded-md">
                        Error processing departure flights.
                    </div>
                `;
            }
        }

        // Display return flights
        if (!return_flights.length) {
            returnColumn.innerHTML += `
                <div class="p-4 bg-yellow-100 text-yellow-700 rounded-md">
                    No return flights found for your search criteria.
                </div>
            `;
        } else {
            try {
                returnColumn.innerHTML += return_flights.map(flight => {
                    try {
                        const offer = flight.itineraries[0];
                        const segment = offer.segments[0];
                        const price = flight.price.total;
                        
                        return `
                            <div class="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow">
                                <div class="flex justify-between items-center mb-4">
                                    <span class="text-lg font-semibold">${getCarrierName(segment.carrierCode)}</span>
                                    <span class="text-xl font-bold text-blue-600">$${parseFloat(price).toFixed(2)}</span>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <div>
                                            <div class="font-medium">${segment.departure.iataCode}</div>
                                            <div class="text-sm font-medium text-gray-700">${segment.departure.cityName || 'Airport'}</div>
                                            <div class="text-sm text-gray-500">${segment.departure.at.split('T')[1].substring(0, 5)}</div>
                                        </div>
                                        <div class="text-center text-gray-400 self-center">
                                            <div class="text-sm">✈️</div>
                                            <div class="text-xs">${formatDuration(segment.duration)}</div>
                                        </div>
                                        <div class="text-right">
                                            <div class="font-medium">${segment.arrival.iataCode}</div>
                                            <div class="text-sm font-medium text-gray-700">${segment.arrival.cityName || 'Airport'}</div>
                                            <div class="text-sm text-gray-500">${segment.arrival.at.split('T')[1].substring(0, 5)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    } catch (error) {
                        console.error('Error processing flight:', error);
                        return '';
                    }
                }).join('');
            } catch (error) {
                console.error('Error processing return flights:', error);
                returnColumn.innerHTML += `
                    <div class="p-4 bg-red-100 text-red-700 rounded-md">
                        Error processing return flights.
                    </div>
                `;
            }
        }

        // Append columns to resultsDiv
        resultsDiv.appendChild(departureColumn);
        resultsDiv.appendChild(returnColumn);

        // Debug log
        console.log('Received data:', data);
    }

    // Add autocomplete functionality for origin
    document.getElementById('origin').addEventListener('input', function() {
        fetch(`/autocomplete?query=${this.value}`)
            .then(response => response.json())
            .then(data => {
                const suggestions = data.map(location => {
                    return `<option value="${location.iataCode}">${location.name} (${location.iataCode})</option>`;
                }).join('');
                document.getElementById('originSuggestions').innerHTML = suggestions;
            });
    });

    // Add autocomplete functionality for destination
    document.getElementById('destination').addEventListener('input', function() {
        fetch(`/autocomplete?query=${this.value}`)
            .then(response => response.json())
            .then(data => {
                const suggestions = data.map(location => {
                    return `<option value="${location.iataCode}">${location.name} (${location.iataCode})</option>`;
                }).join('');
                document.getElementById('destinationSuggestions').innerHTML = suggestions;
            });
    });

    // Add airline carrier codes mapping
    const carrierCodes = {
        'D8': 'Norwegian Air',
        'LH': 'Lufthansa',
        'BA': 'British Airways',
        'AF': 'Air France',
        'LY': 'El Al',
        'TK': 'Turkish Airlines',
        'EK': 'Emirates',
        'DL': 'Delta Airlines',
        'AA': 'American Airlines',
        'UA': 'United Airlines',
        'UX': 'Air Europa',
        'DY': 'Norwegian Air Shuttle',
        'BT': 'Air Baltic',
        'A3': 'Aegean Airlines',
        'VY': 'Vueling Airlines',
        'LX': 'Swiss International Air Lines',
        'KM': 'Nigger Airlines Limited',

        // Add more carriers as needed
    };

    function getCarrierName(code) {
        return carrierCodes[code] || code;
    }
});
