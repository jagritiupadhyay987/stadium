/**
 * Global Cricket Stadiums Database
 * Contains 40+ international cricket stadiums across 15 countries
 */

const GLOBAL_STADIUMS = [
  // INDIA (15)
  {
    id: 'narendra-modi',
    name: 'Narendra Modi Stadium',
    city: 'Ahmedabad',
    country: 'India',
    capacity: 132000,
    coordinates: { lat: 23.0919, lng: 72.5975 },
    established: 1982,
    homeTeam: 'Gujarat Titans',
    ends: ['Adani Pavilion End', 'Reliance End'],
    floodlights: true
  },
  {
    id: 'eden-gardens',
    name: 'Eden Gardens',
    city: 'Kolkata',
    country: 'India',
    capacity: 66000,
    coordinates: { lat: 22.5646, lng: 88.3433 },
    established: 1864,
    homeTeam: 'Kolkata Knight Riders',
    ends: ['High Court End', 'Pavilion End'],
    floodlights: true
  },
  {
    id: 'wankhede',
    name: 'Wankhede Stadium',
    city: 'Mumbai',
    country: 'India',
    capacity: 33108,
    coordinates: { lat: 18.9389, lng: 72.8258 },
    established: 1974,
    homeTeam: 'Mumbai Indians',
    ends: ['Garware Pavilion End', 'Tata End'],
    floodlights: true
  },
  {
    id: 'chinnaswamy',
    name: 'M. Chinnaswamy Stadium',
    city: 'Bengaluru',
    country: 'India',
    capacity: 40000,
    coordinates: { lat: 12.9788, lng: 77.5996 },
    established: 1969,
    homeTeam: 'Royal Challengers Bangalore',
    ends: ['Pavilion End', 'BEML End'],
    floodlights: true
  },
  {
    id: 'arun-jaitley',
    name: 'Arun Jaitley Stadium',
    city: 'Delhi',
    country: 'India',
    capacity: 41842,
    coordinates: { lat: 28.6379, lng: 77.2431 },
    established: 1883,
    homeTeam: 'Delhi Capitals',
    ends: ['Stadium End', 'Pavilion End'],
    floodlights: true
  },
  {
    id: 'rajiv-gandhi',
    name: 'Rajiv Gandhi International Stadium',
    city: 'Hyderabad',
    country: 'India',
    capacity: 55000,
    coordinates: { lat: 17.4065, lng: 78.5505 },
    established: 2003,
    homeTeam: 'Sunrisers Hyderabad',
    ends: ['Pavilion End', 'North End'],
    floodlights: true
  },
  {
    id: 'aca-vdca',
    name: 'ACA-VDCA Cricket Stadium',
    city: 'Visakhapatnam',
    country: 'India',
    capacity: 25000,
    coordinates: { lat: 17.7983, lng: 83.3515 },
    established: 2003,
    homeTeam: 'Andhra',
    ends: ['Vizag End', 'VDCA End'],
    floodlights: true
  },
  {
    id: 'chepauk',
    name: 'M. A. Chidambaram Stadium',
    city: 'Chennai',
    country: 'India',
    capacity: 50000,
    coordinates: { lat: 13.0628, lng: 80.2793 },
    established: 1916,
    homeTeam: 'Chennai Super Kings',
    ends: ['Anna Pavilion End', 'V Pattabiraman Gate End'],
    floodlights: true
  },
  {
    id: 'sawai-mansingh',
    name: 'Sawai Mansingh Stadium',
    city: 'Jaipur',
    country: 'India',
    capacity: 30000,
    coordinates: { lat: 26.8940, lng: 75.8055 },
    established: 1969,
    homeTeam: 'Rajasthan Royals',
    ends: ['City End', 'Pavilion End'],
    floodlights: true
  },
  {
    id: 'punjab-mohali',
    name: 'IS Bindra Stadium',
    city: 'Mohali',
    country: 'India',
    capacity: 26000,
    coordinates: { lat: 30.6908, lng: 76.7374 },
    established: 1993,
    homeTeam: 'Punjab Kings',
    ends: ['Pavilion End', 'City End'],
    floodlights: true
  },
  {
    id: 'green-park',
    name: 'Green Park Stadium',
    city: 'Kanpur',
    country: 'India',
    capacity: 32000,
    coordinates: { lat: 26.4819, lng: 80.3479 },
    established: 1945,
    homeTeam: 'Uttar Pradesh',
    ends: ['Millcott End', 'Pavilion End'],
    floodlights: true
  },
  {
    id: 'barabati',
    name: 'Barabati Stadium',
    city: 'Cuttack',
    country: 'India',
    capacity: 45000,
    coordinates: { lat: 20.4809, lng: 85.8690 },
    established: 1958,
    homeTeam: 'Odisha',
    ends: ['Mahanadi River End', 'Pavilion End'],
    floodlights: true
  },
  {
    id: 'holkar',
    name: 'Holkar Cricket Stadium',
    city: 'Indore',
    country: 'India',
    capacity: 30000,
    coordinates: { lat: 22.7239, lng: 75.8770 },
    established: 2006,
    homeTeam: 'Madhya Pradesh',
    ends: ['GAIL End', 'Pavilion End'],
    floodlights: true
  },
  {
    id: 'dharamshala',
    name: 'HPCA Stadium',
    city: 'Dharamshala',
    country: 'India',
    capacity: 23000,
    coordinates: { lat: 32.1976, lng: 76.3259 },
    established: 2003,
    homeTeam: 'Himachal Pradesh',
    ends: ['River End', 'College End'],
    floodlights: true
  },
  {
    id: 'jsca-ranchi',
    name: 'JSCA International Stadium Complex',
    city: 'Ranchi',
    country: 'India',
    capacity: 50000,
    coordinates: { lat: 23.3103, lng: 85.2755 },
    established: 2011,
    homeTeam: 'Jharkhand',
    ends: ['Pavilion End', 'North End'],
    floodlights: true
  },

  // AUSTRALIA (5)
  {
    id: 'mcg',
    name: 'Melbourne Cricket Ground',
    city: 'Melbourne',
    country: 'Australia',
    capacity: 100024,
    coordinates: { lat: -37.8199, lng: 144.9834 },
    established: 1853,
    homeTeam: 'Melbourne Stars',
    ends: ['Members End', 'Great Southern Stand End'],
    floodlights: true
  },
  {
    id: 'scg',
    name: 'Sydney Cricket Ground',
    city: 'Sydney',
    country: 'Australia',
    capacity: 48000,
    coordinates: { lat: -33.8916, lng: 151.2248 },
    established: 1848,
    homeTeam: 'Sydney Sixers',
    ends: ['Paddington End', 'Randwick End'],
    floodlights: true
  },
  {
    id: 'gabba',
    name: 'The Gabba',
    city: 'Brisbane',
    country: 'Australia',
    capacity: 42000,
    coordinates: { lat: -27.4858, lng: 153.0379 },
    established: 1895,
    homeTeam: 'Brisbane Heat',
    ends: ['Stanley Street End', 'Vulture Street End'],
    floodlights: true
  },
  {
    id: 'adelaide-oval',
    name: 'Adelaide Oval',
    city: 'Adelaide',
    country: 'Australia',
    capacity: 53500,
    coordinates: { lat: -34.9155, lng: 138.5961 },
    established: 1871,
    homeTeam: 'Adelaide Strikers',
    ends: ['City End', 'Cathedral End'],
    floodlights: true
  },
  {
    id: 'optus-perth',
    name: 'Optus Stadium',
    city: 'Perth',
    country: 'Australia',
    capacity: 60000,
    coordinates: { lat: -31.9511, lng: 115.8890 },
    established: 2018,
    homeTeam: 'Perth Scorchers',
    ends: ['River End', 'Prindiville Stand End'],
    floodlights: true
  },

  // ENGLAND (5)
  {
    id: 'lords',
    name: "Lord's Cricket Ground",
    city: 'London',
    country: 'England',
    capacity: 31100,
    coordinates: { lat: 51.5306, lng: -0.1727 },
    established: 1814,
    homeTeam: 'Middlesex',
    ends: ['Pavilion End', 'Nursery End'],
    floodlights: true
  },
  {
    id: 'the-oval',
    name: 'The Oval',
    city: 'London',
    country: 'England',
    capacity: 25500,
    coordinates: { lat: 51.4837, lng: -0.1150 },
    established: 1845,
    homeTeam: 'Surrey',
    ends: ['Pavilion End', 'Vauxhall End'],
    floodlights: true
  },
  {
    id: 'old-trafford',
    name: 'Old Trafford',
    city: 'Manchester',
    country: 'England',
    capacity: 26000,
    coordinates: { lat: 53.4564, lng: -2.2875 },
    established: 1857,
    homeTeam: 'Lancashire',
    ends: ['Stretford End', 'Brian Statham End'],
    floodlights: true
  },
  {
    id: 'edgbaston',
    name: 'Edgbaston Cricket Ground',
    city: 'Birmingham',
    country: 'England',
    capacity: 25000,
    coordinates: { lat: 52.4556, lng: -1.9028 },
    established: 1882,
    homeTeam: 'Warwickshire',
    ends: ['City End', 'Pavilion End'],
    floodlights: true
  },
  {
    id: 'headingley',
    name: 'Headingley Cricket Ground',
    city: 'Leeds',
    country: 'England',
    capacity: 18350,
    coordinates: { lat: 53.8177, lng: -1.5817 },
    established: 1890,
    homeTeam: 'Yorkshire',
    ends: ['Kirkstall Lane End', 'Football Stand End'],
    floodlights: true
  },

  // PAKISTAN (3)
  {
    id: 'gaddafi-lahore',
    name: 'Gaddafi Stadium',
    city: 'Lahore',
    country: 'Pakistan',
    capacity: 27000,
    coordinates: { lat: 31.5125, lng: 74.3314 },
    established: 1959,
    homeTeam: 'Lahore Qalandars',
    ends: ['Pavilion End', 'College End'],
    floodlights: true
  },
  {
    id: 'national-karachi',
    name: 'National Stadium',
    city: 'Karachi',
    country: 'Pakistan',
    capacity: 34228,
    coordinates: { lat: 24.8942, lng: 67.0792 },
    established: 1955,
    homeTeam: 'Karachi Kings',
    ends: ['Pavilion End', 'University End'],
    floodlights: true
  },
  {
    id: 'rawalpindi',
    name: 'Rawalpindi Cricket Stadium',
    city: 'Rawalpindi',
    country: 'Pakistan',
    capacity: 15000,
    coordinates: { lat: 33.6491, lng: 73.0786 },
    established: 1992,
    homeTeam: 'Islamabad United',
    ends: ['Pavilion End', 'Shell End'],
    floodlights: true
  },

  // SOUTH AFRICA (3)
  {
    id: 'wanderers',
    name: 'Wanderers Stadium',
    city: 'Johannesburg',
    country: 'South Africa',
    capacity: 34000,
    coordinates: { lat: -26.1325, lng: 28.0514 },
    established: 1956,
    homeTeam: 'Lions',
    ends: ['Corlett Drive End', 'Golf Course End'],
    floodlights: true
  },
  {
    id: 'newlands',
    name: 'Newlands Cricket Ground',
    city: 'Cape Town',
    country: 'South Africa',
    capacity: 25000,
    coordinates: { lat: -33.9744, lng: 18.4683 },
    established: 1888,
    homeTeam: 'Cape Cobras',
    ends: ['Wynberg End', 'Kelvin Grove End'],
    floodlights: true
  },
  {
    id: 'kingsmead',
    name: 'Kingsmead Cricket Ground',
    city: 'Durban',
    country: 'South Africa',
    capacity: 25000,
    coordinates: { lat: -29.8511, lng: 31.0294 },
    established: 1923,
    homeTeam: 'Dolphins',
    ends: ['Umgeni End', 'Old Fort Road End'],
    floodlights: true
  },

  // NEW ZEALAND (2)
  {
    id: 'eden-park',
    name: 'Eden Park',
    city: 'Auckland',
    country: 'New Zealand',
    capacity: 42000,
    coordinates: { lat: -36.8750, lng: 174.7444 },
    established: 1900,
    homeTeam: 'Auckland Aces',
    ends: ['Sandringham Road End', 'Terrace End'],
    floodlights: true
  },
  {
    id: 'basin-reserve',
    name: 'Basin Reserve',
    city: 'Wellington',
    country: 'New Zealand',
    capacity: 11600,
    coordinates: { lat: -41.3021, lng: 174.7806 },
    established: 1868,
    homeTeam: 'Wellington Firebirds',
    ends: ['Vance Stand End', 'Scoreboard End'],
    floodlights: false
  },

  // SRI LANKA (2)
  {
    id: 'r-premadasa',
    name: 'R. Premadasa Stadium',
    city: 'Colombo',
    country: 'Sri Lanka',
    capacity: 35000,
    coordinates: { lat: 6.9397, lng: 79.8714 },
    established: 1986,
    homeTeam: 'Sri Lanka',
    ends: ['Khettarama End', 'Scoreboard End'],
    floodlights: true
  },
  {
    id: 'galle',
    name: 'Galle International Stadium',
    city: 'Galle',
    country: 'Sri Lanka',
    capacity: 18000,
    coordinates: { lat: 6.0336, lng: 80.2144 },
    established: 1876,
    homeTeam: 'Sri Lanka',
    ends: ['City End', 'Fort End'],
    floodlights: false
  },

  // WEST INDIES (2)
  {
    id: 'kensington-oval',
    name: 'Kensington Oval',
    city: 'Bridgetown',
    country: 'Barbados',
    capacity: 28000,
    coordinates: { lat: 13.1061, lng: -59.6200 },
    established: 1882,
    homeTeam: 'Barbados Tridents',
    ends: ['Malcolm Marshall End', 'Joel Garner End'],
    floodlights: true
  },
  {
    id: 'queens-park-oval',
    name: "Queen's Park Oval",
    city: 'Port of Spain',
    country: 'Trinidad',
    capacity: 20000,
    coordinates: { lat: 10.6672, lng: -61.5200 },
    established: 1896,
    homeTeam: 'Trinbago Knight Riders',
    ends: ['Pavilion End', 'Media Centre End'],
    floodlights: true
  },

  // BANGLADESH (1)
  {
    id: 'sher-e-bangla-dhaka',
    name: 'Sher-e-Bangla National Cricket Stadium',
    city: 'Dhaka',
    country: 'Bangladesh',
    capacity: 25000,
    coordinates: { lat: 23.8069, lng: 90.3636 },
    established: 2006,
    homeTeam: 'Dhaka Dynamites',
    ends: ['Ispahani End', 'Aqua Paints End'],
    floodlights: true
  },

  // UAE (2)
  {
    id: 'dubai-international',
    name: 'Dubai International Cricket Stadium',
    city: 'Dubai',
    country: 'UAE',
    capacity: 25000,
    coordinates: { lat: 25.0441, lng: 55.2208 },
    established: 2009,
    homeTeam: 'UAE',
    ends: ['Emirates Road End', 'Dubai Sports City End'],
    floodlights: true
  },
  {
    id: 'sharjah',
    name: 'Sharjah Cricket Stadium',
    city: 'Sharjah',
    country: 'UAE',
    capacity: 16000,
    coordinates: { lat: 25.3300, lng: 55.4200 },
    established: 1982,
    homeTeam: 'UAE',
    ends: ['Pavilion End', 'Sharjah Club End'],
    floodlights: true
  },

  // AFGHANISTAN (1)
  {
    id: 'kabul',
    name: 'Kabul International Cricket Stadium',
    city: 'Kabul',
    country: 'Afghanistan',
    capacity: 6000,
    coordinates: { lat: 34.5000, lng: 69.2000 },
    established: 2011,
    homeTeam: 'Afghanistan',
    ends: ['Kabul End', 'National End'],
    floodlights: false
  },

  // ZIMBABWE (1)
  {
    id: 'harare-sports-club',
    name: 'Harare Sports Club',
    city: 'Harare',
    country: 'Zimbabwe',
    capacity: 10000,
    coordinates: { lat: -17.8175, lng: 31.0475 },
    established: 1900,
    homeTeam: 'Zimbabwe',
    ends: ['City End', 'Club House End'],
    floodlights: false
  },

  // IRELAND (1)
  {
    id: 'malahide-dublin',
    name: 'Malahide Cricket Club Ground',
    city: 'Dublin',
    country: 'Ireland',
    capacity: 11500,
    coordinates: { lat: 53.4500, lng: -6.1500 },
    established: 1861,
    homeTeam: 'Ireland',
    ends: ['Dublin Road End', 'Castle End'],
    floodlights: false
  }
];

if (typeof module !== 'undefined') {
  module.exports = GLOBAL_STADIUMS;
}
