// Static location data for countries, states, and cities
export const locationData = {
    "United States": {
        "California": ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "Fresno", "Oakland", "San Jose"],
        "New York": ["New York City", "Buffalo", "Rochester", "Syracuse", "Albany", "Yonkers"],
        "Texas": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso"],
        "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee", "Fort Lauderdale"],
        "Illinois": ["Chicago", "Springfield", "Rockford", "Peoria", "Elgin", "Waukegan"],
        "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton"],
        "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"],
        "Georgia": ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens"],
        "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville"],
        "Michigan": ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor"]
    },
    "Canada": {
        "Ontario": ["Toronto", "Ottawa", "Hamilton", "London", "Kitchener", "Windsor"],
        "Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke"],
        "British Columbia": ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond", "Abbotsford"],
        "Alberta": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "Medicine Hat", "Grande Prairie"],
        "Manitoba": ["Winnipeg", "Brandon", "Steinbach", "Thompson", "Portage la Prairie", "Winkler"],
        "Saskatchewan": ["Saskatoon", "Regina", "Prince Albert", "Moose Jaw", "Swift Current", "Yorkton"]
    },
    "United Kingdom": {
        "England": ["London", "Birmingham", "Manchester", "Liverpool", "Leeds", "Sheffield", "Bristol"],
        "Scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Stirling", "Perth"],
        "Wales": ["Cardiff", "Swansea", "Newport", "Wrexham", "Bangor", "St. Davids"],
        "Northern Ireland": ["Belfast", "Derry", "Lisburn", "Newtownabbey", "Bangor", "Craigavon"]
    },
    "Australia": {
        "New South Wales": ["Sydney", "Newcastle", "Wollongong", "Tamworth", "Orange", "Dubbo"],
        "Victoria": ["Melbourne", "Geelong", "Ballarat", "Bendigo", "Shepparton", "Warrnambool"],
        "Queensland": ["Brisbane", "Gold Coast", "Townsville", "Cairns", "Toowoomba", "Rockhampton"],
        "Western Australia": ["Perth", "Fremantle", "Bunbury", "Geraldton", "Kalgoorlie", "Mandurah"],
        "South Australia": ["Adelaide", "Mount Gambier", "Whyalla", "Murray Bridge", "Port Augusta", "Port Pirie"],
        "Tasmania": ["Hobart", "Launceston", "Devonport", "Burnie", "Somerset", "Queenstown"]
    },
    "India": {
        "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur"],
        "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga"],
        "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirapalli", "Tirunelveli"],
        "Delhi": ["New Delhi", "Delhi Cantonment", "Narela", "Najafgarh", "Alipur"],
        "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar"],
        "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur"],
        "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman"],
        "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi"]
    },
    "Germany": {
        "Bavaria": ["Munich", "Nuremberg", "Augsburg", "Regensburg", "Ingolstadt", "Würzburg"],
        "North Rhine-Westphalia": ["Cologne", "Düsseldorf", "Dortmund", "Essen", "Duisburg", "Bochum"],
        "Baden-Württemberg": ["Stuttgart", "Mannheim", "Karlsruhe", "Freiburg", "Heidelberg", "Ulm"],
        "Lower Saxony": ["Hanover", "Braunschweig", "Oldenburg", "Osnabrück", "Wolfsburg", "Göttingen"],
        "Hesse": ["Frankfurt", "Wiesbaden", "Kassel", "Darmstadt", "Offenbach", "Fulda"],
        "Berlin": ["Berlin"]
    },
    "France": {
        "Île-de-France": ["Paris", "Boulogne-Billancourt", "Saint-Denis", "Argenteuil", "Montreuil", "Créteil"],
        "Provence-Alpes-Côte d'Azur": ["Marseille", "Nice", "Toulon", "Aix-en-Provence", "Avignon", "Antibes"],
        "Auvergne-Rhône-Alpes": ["Lyon", "Grenoble", "Saint-Étienne", "Villeurbanne", "Clermont-Ferrand", "Chambéry"],
        "Occitanie": ["Toulouse", "Montpellier", "Nîmes", "Perpignan", "Béziers", "Narbonne"],
        "Nouvelle-Aquitaine": ["Bordeaux", "Limoges", "Poitiers", "Pau", "La Rochelle", "Bayonne"],
        "Hauts-de-France": ["Lille", "Amiens", "Roubaix", "Tourcoing", "Dunkirk", "Calais"]
    }
};

export const getCountries = () => {
    return Object.keys(locationData).sort();
};

export const getStates = (country) => {
    if (!country || !locationData[country]) return [];
    return Object.keys(locationData[country]).sort();
};

export const getCities = (country, state) => {
    if (!country || !state || !locationData[country] || !locationData[country][state]) return [];
    return locationData[country][state].sort();
};
