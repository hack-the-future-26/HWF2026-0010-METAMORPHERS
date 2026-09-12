import { getDestination } from '@/data/destinations'
import { registerPlaces } from '@/data/places'
import { haversineKm } from '@/lib/utils'
import { satellitePhoto } from '@/lib/media'
import type { LatLng, Place, PlaceCategory, TravelStyle } from '@/types'

type Poi = {
  name: string
  lat: number
  lng: number
  address: string
  category: PlaceCategory
  styles: TravelStyle[]
  indoor?: boolean
  durationMin?: number
}

const POIS: Record<string, Poi[]> = {
  delhi: [
    { name: 'India Gate', lat: 28.6129, lng: 77.2295, address: 'Rajpath, New Delhi', category: 'attraction', styles: ['history', 'photography'] },
    { name: 'Qutub Minar', lat: 28.5245, lng: 77.1855, address: 'Mehrauli, New Delhi', category: 'attraction', styles: ['history', 'culture'] },
    { name: 'Humayun’s Tomb', lat: 28.5933, lng: 77.2507, address: 'Nizamuddin, New Delhi', category: 'attraction', styles: ['history', 'photography'] },
    { name: 'Lotus Temple', lat: 28.5535, lng: 77.2588, address: 'Kalkaji, New Delhi', category: 'attraction', styles: ['culture', 'relaxation'], indoor: true },
    { name: 'Red Fort', lat: 28.6562, lng: 77.241, address: 'Netaji Subhash Marg, Delhi', category: 'attraction', styles: ['history'] },
    { name: 'Chandni Chowk', lat: 28.6506, lng: 77.2303, address: 'Old Delhi', category: 'attraction', styles: ['food', 'culture'] },
  ],
  mumbai: [
    { name: 'Gateway of India', lat: 18.922, lng: 72.8347, address: 'Apollo Bandar, Colaba', category: 'attraction', styles: ['history', 'photography'] },
    { name: 'Marine Drive', lat: 18.9432, lng: 72.8236, address: 'Netaji Subhash Chandra Bose Road', category: 'attraction', styles: ['beaches', 'relaxation'] },
    { name: 'Chhatrapati Shivaji Maharaj Terminus', lat: 18.9398, lng: 72.8355, address: 'Fort, Mumbai', category: 'attraction', styles: ['history', 'photography'] },
    { name: 'Juhu Beach', lat: 19.0948, lng: 72.8258, address: 'Juhu Tara Road', category: 'attraction', styles: ['beaches', 'food'] },
    { name: 'Siddhivinayak Temple', lat: 19.0469, lng: 72.8649, address: 'Prabhadevi', category: 'attraction', styles: ['culture'], indoor: true },
  ],
  bengaluru: [
    { name: 'Lalbagh Botanical Garden', lat: 12.9507, lng: 77.5848, address: 'Mavalli, Bengaluru', category: 'attraction', styles: ['nature'] },
    { name: 'Cubbon Park', lat: 12.9763, lng: 77.5929, address: 'Kasturba Road', category: 'attraction', styles: ['nature', 'relaxation'] },
    { name: 'Bangalore Palace', lat: 12.9988, lng: 77.5921, address: 'Vasanth Nagar', category: 'attraction', styles: ['history'] },
    { name: 'ISKCON Temple Bengaluru', lat: 13.0098, lng: 77.5511, address: 'Rajajinagar', category: 'attraction', styles: ['culture'], indoor: true },
  ],
  hyderabad: [
    { name: 'Charminar', lat: 17.3616, lng: 78.4747, address: 'Charminar Rd, Hyderabad', category: 'attraction', styles: ['history', 'culture'] },
    { name: 'Golconda Fort', lat: 17.3833, lng: 78.4011, address: 'Ibrahim Bagh', category: 'attraction', styles: ['history', 'adventure'] },
    { name: 'Hussain Sagar', lat: 17.4239, lng: 78.4738, address: 'Necklace Road', category: 'attraction', styles: ['relaxation', 'photography'] },
    { name: 'Chowmahalla Palace', lat: 17.3578, lng: 78.4717, address: 'Khilwat, Hyderabad', category: 'attraction', styles: ['history'] },
  ],
  chennai: [
    { name: 'Marina Beach', lat: 13.05, lng: 80.2824, address: 'Kamarajar Salai', category: 'attraction', styles: ['beaches'] },
    { name: 'Kapaleeshwarar Temple', lat: 13.0336, lng: 80.2707, address: 'Mylapore', category: 'attraction', styles: ['culture'], indoor: true },
    { name: 'Fort St. George', lat: 13.0802, lng: 80.2875, address: 'Rajaji Salai', category: 'attraction', styles: ['history'] },
    { name: 'Santhome Cathedral', lat: 13.0334, lng: 80.2775, address: 'Santhome', category: 'attraction', styles: ['culture'], indoor: true },
  ],
  kolkata: [
    { name: 'Victoria Memorial', lat: 22.5448, lng: 88.3426, address: 'Queen’s Way', category: 'attraction', styles: ['history', 'photography'] },
    { name: 'Howrah Bridge', lat: 22.5851, lng: 88.3468, address: 'Hooghly River', category: 'attraction', styles: ['photography'] },
    { name: 'Indian Museum', lat: 22.5579, lng: 88.3511, address: 'Chowringhee', category: 'attraction', styles: ['history', 'culture'], indoor: true },
    { name: 'Dakshineswar Kali Temple', lat: 22.655, lng: 88.3577, address: 'Dakshineswar', category: 'attraction', styles: ['culture'] },
  ],
  jaipur: [
    { name: 'Hawa Mahal', lat: 26.9239, lng: 75.8267, address: 'Badi Choupad', category: 'attraction', styles: ['history', 'photography'] },
    { name: 'Amber Fort', lat: 26.9855, lng: 75.8513, address: 'Amer, Jaipur', category: 'attraction', styles: ['history', 'adventure'] },
    { name: 'City Palace Jaipur', lat: 26.9258, lng: 75.8236, address: 'Tulsi Marg', category: 'attraction', styles: ['history'] },
    { name: 'Jantar Mantar', lat: 26.9248, lng: 75.8246, address: 'Gangori Bazaar', category: 'attraction', styles: ['history'] },
  ],
  agra: [
    { name: 'Taj Mahal', lat: 27.1751, lng: 78.0421, address: 'Dharmapuri, Agra', category: 'attraction', styles: ['history', 'photography'] },
    { name: 'Agra Fort', lat: 27.1795, lng: 78.0211, address: 'Rakabganj', category: 'attraction', styles: ['history'] },
    { name: 'Mehtab Bagh', lat: 27.18, lng: 78.0422, address: 'Across the Yamuna', category: 'attraction', styles: ['photography', 'relaxation'] },
    { name: 'Itimad-ud-Daulah', lat: 27.1927, lng: 78.0307, address: 'Moti Bagh', category: 'attraction', styles: ['history'] },
  ],
  varanasi: [
    { name: 'Dashashwamedh Ghat', lat: 25.3067, lng: 83.0104, address: 'Godowlia', category: 'attraction', styles: ['culture', 'photography'] },
    { name: 'Kashi Vishwanath Temple', lat: 25.3109, lng: 83.0107, address: 'Lahori Tola', category: 'attraction', styles: ['culture'], indoor: true },
    { name: 'Assi Ghat', lat: 25.282, lng: 83.0063, address: 'Assi', category: 'attraction', styles: ['culture', 'relaxation'] },
    { name: 'Sarnath', lat: 25.3808, lng: 83.0245, address: 'Sarnath', category: 'attraction', styles: ['history'] },
  ],
  goa: [
    { name: 'Baga Beach', lat: 15.5553, lng: 73.7517, address: 'Baga, North Goa', category: 'attraction', styles: ['beaches'] },
    { name: 'Calangute Beach', lat: 15.5439, lng: 73.7553, address: 'Calangute', category: 'attraction', styles: ['beaches'] },
    { name: 'Basilica of Bom Jesus', lat: 15.5009, lng: 73.9116, address: 'Old Goa', category: 'attraction', styles: ['history', 'culture'], indoor: true },
    { name: 'Fort Aguada', lat: 15.4924, lng: 73.7735, address: 'Candolim', category: 'attraction', styles: ['history', 'photography'] },
    { name: 'Panaji Church Square', lat: 15.4981, lng: 73.8278, address: 'Altinho / Church Square', category: 'attraction', styles: ['culture'] },
  ],
  udaipur: [
    { name: 'City Palace Udaipur', lat: 24.5764, lng: 73.6835, address: 'Old City', category: 'attraction', styles: ['history'] },
    { name: 'Lake Pichola', lat: 24.572, lng: 73.678, address: 'Pichola', category: 'attraction', styles: ['relaxation', 'photography'] },
    { name: 'Jagdish Temple', lat: 24.5797, lng: 73.6839, address: 'Jagdish Chowk', category: 'attraction', styles: ['culture'], indoor: true },
    { name: 'Saheliyon ki Bari', lat: 24.5995, lng: 73.6856, address: 'Fateh Circuit', category: 'attraction', styles: ['nature'] },
  ],
  kochi: [
    { name: 'Chinese Fishing Nets', lat: 9.9674, lng: 76.2425, address: 'Fort Kochi', category: 'attraction', styles: ['photography', 'culture'] },
    { name: 'Mattancherry Palace', lat: 9.958, lng: 76.2594, address: 'Jew Town', category: 'attraction', styles: ['history'], indoor: true },
    { name: 'Santa Cruz Basilica', lat: 9.9646, lng: 76.2422, address: 'Fort Kochi', category: 'attraction', styles: ['culture'], indoor: true },
    { name: 'Jew Town', lat: 9.9575, lng: 76.2597, address: 'Mattancherry', category: 'attraction', styles: ['culture', 'shopping'] },
  ],
  munnar: [
    { name: 'Munnar Tea Museum', lat: 10.0792, lng: 77.062, address: 'Nullatanni', category: 'attraction', styles: ['nature'], indoor: true },
    { name: 'Eravikulam National Park', lat: 10.203, lng: 77.068, address: 'Rajamalai', category: 'attraction', styles: ['nature', 'adventure'] },
    { name: 'Mattupetty Dam', lat: 10.106, lng: 77.123, address: 'Mattupetty', category: 'attraction', styles: ['nature'] },
    { name: 'Top Station', lat: 10.122, lng: 77.248, address: 'Kerala–Tamil Nadu border', category: 'attraction', styles: ['photography'] },
  ],
  pondy: [
    { name: 'Promenade Beach', lat: 11.933, lng: 79.8358, address: 'Goubert Avenue', category: 'attraction', styles: ['beaches'] },
    { name: 'French War Memorial', lat: 11.9338, lng: 79.835, address: 'White Town', category: 'attraction', styles: ['history'] },
    { name: 'Sri Aurobindo Ashram', lat: 11.936, lng: 79.834, address: 'Rue de la Marine', category: 'attraction', styles: ['culture'], indoor: true },
    { name: 'Auroville Visitor Centre', lat: 12.005, lng: 79.8106, address: 'Auroville', category: 'attraction', styles: ['culture'] },
  ],
  vizag: [
    { name: 'RK Beach', lat: 17.7142, lng: 83.3187, address: 'Beach Road, Visakhapatnam', category: 'attraction', styles: ['beaches'] },
    { name: 'Kailasagiri', lat: 17.7489, lng: 83.3425, address: 'Kailasagiri Hill', category: 'attraction', styles: ['nature', 'photography'] },
    { name: 'INS Kursura Submarine Museum', lat: 17.7178, lng: 83.3304, address: 'Beach Road', category: 'attraction', styles: ['history'], indoor: true, durationMin: 70 },
    { name: 'Rushikonda Beach', lat: 17.7826, lng: 83.385, address: 'Rushikonda', category: 'attraction', styles: ['beaches', 'adventure'] },
    { name: 'Yarada Beach', lat: 17.6518, lng: 83.2654, address: 'Yarada', category: 'attraction', styles: ['beaches'] },
  ],
  amritsar: [
    { name: 'Golden Temple', lat: 31.62, lng: 74.8765, address: 'Atta Mandi, Amritsar', category: 'attraction', styles: ['culture'], indoor: true },
    { name: 'Jallianwala Bagh', lat: 31.6206, lng: 74.8801, address: 'Golden Temple Road', category: 'attraction', styles: ['history'] },
    { name: 'Partition Museum', lat: 31.6258, lng: 74.8788, address: 'Town Hall', category: 'attraction', styles: ['history'], indoor: true },
    { name: 'Wagah Border', lat: 31.6048, lng: 74.573, address: 'Attari–Wagah', category: 'attraction', styles: ['culture'] },
  ],
  rishikesh: [
    { name: 'Laxman Jhula', lat: 30.126, lng: 78.3301, address: 'Tapovan', category: 'attraction', styles: ['culture', 'adventure'] },
    { name: 'Ram Jhula', lat: 30.123, lng: 78.314, address: 'Swarg Ashram', category: 'attraction', styles: ['culture'] },
    { name: 'Triveni Ghat', lat: 30.1035, lng: 78.3102, address: 'Rishikesh', category: 'attraction', styles: ['culture'] },
    { name: 'Beatles Ashram', lat: 30.1185, lng: 78.3294, address: 'Muni Ki Reti', category: 'attraction', styles: ['history'] },
  ],
  manali: [
    { name: 'Hadimba Temple', lat: 32.2486, lng: 77.1816, address: 'Dhungri Van Vihar', category: 'attraction', styles: ['culture', 'nature'] },
    { name: 'Solang Valley', lat: 32.316, lng: 77.157, address: 'Solang', category: 'attraction', styles: ['adventure', 'nature'] },
    { name: 'Old Manali', lat: 32.248, lng: 77.177, address: 'Manu Temple Road', category: 'attraction', styles: ['food', 'relaxation'] },
    { name: 'Jogini Falls', lat: 32.266, lng: 77.188, address: 'Vashisht', category: 'attraction', styles: ['nature'] },
  ],
  shimla: [
    { name: 'The Ridge Shimla', lat: 31.1046, lng: 77.1734, address: 'Scandal Point', category: 'attraction', styles: ['photography'] },
    { name: 'Mall Road Shimla', lat: 31.1048, lng: 77.171, address: 'Mall Road', category: 'attraction', styles: ['shopping', 'relaxation'] },
    { name: 'Jakhu Temple', lat: 31.1006, lng: 77.184, address: 'Jakhu Hill', category: 'attraction', styles: ['culture'] },
    { name: 'Christ Church Shimla', lat: 31.1044, lng: 77.174, address: 'The Ridge', category: 'attraction', styles: ['history'], indoor: true },
  ],
  mysuru: [
    { name: 'Mysore Palace', lat: 12.3052, lng: 76.6552, address: 'Sayyaji Rao Road', category: 'attraction', styles: ['history'] },
    { name: 'Chamundi Hill', lat: 12.2726, lng: 76.6708, address: 'Chamundi Hill', category: 'attraction', styles: ['culture'] },
    { name: 'Devaraja Market', lat: 12.311, lng: 76.658, address: 'Sayyaji Rao Road', category: 'attraction', styles: ['shopping', 'food'] },
    { name: 'St. Philomena’s Cathedral', lat: 12.3211, lng: 76.6583, address: 'Ashoka Road', category: 'attraction', styles: ['culture'], indoor: true },
  ],
  jaisalmer: [
    { name: 'Jaisalmer Fort', lat: 26.9124, lng: 70.9123, address: 'Fort Road', category: 'attraction', styles: ['history'] },
    { name: 'Patwon Ki Haveli', lat: 26.9165, lng: 70.9137, address: 'Near Fort', category: 'attraction', styles: ['history'] },
    { name: 'Gadisar Lake', lat: 26.908, lng: 70.924, address: 'South of Fort', category: 'attraction', styles: ['relaxation'] },
    { name: 'Sam Sand Dunes', lat: 26.845, lng: 70.505, address: 'Sam', category: 'attraction', styles: ['adventure', 'photography'] },
  ],
  hampi: [
    { name: 'Virupaksha Temple', lat: 15.335, lng: 76.46, address: 'Hampi Bazaar', category: 'attraction', styles: ['culture', 'history'] },
    { name: 'Vittala Temple', lat: 15.3417, lng: 76.475, address: 'Venkatappa Bhavi', category: 'attraction', styles: ['history'] },
    { name: 'Stone Chariot', lat: 15.3419, lng: 76.4752, address: 'Vittala Temple complex', category: 'attraction', styles: ['photography'] },
    { name: 'Lotus Mahal', lat: 15.321, lng: 76.47, address: 'Zenana Enclosure', category: 'attraction', styles: ['history'] },
  ],
  pune: [
    { name: 'Shaniwar Wada', lat: 18.5195, lng: 73.8553, address: 'Shaniwar Peth', category: 'attraction', styles: ['history'] },
    { name: 'Aga Khan Palace', lat: 18.5522, lng: 73.9015, address: 'Nagar Road', category: 'attraction', styles: ['history'] },
    { name: 'Sinhagad Fort', lat: 18.3664, lng: 73.7559, address: 'Sinhagad', category: 'attraction', styles: ['adventure'] },
    { name: 'Dagadusheth Halwai Ganpati', lat: 18.5165, lng: 73.856, address: 'Budhwar Peth', category: 'attraction', styles: ['culture'], indoor: true },
  ],
  darjeeling: [
    { name: 'Tiger Hill', lat: 27.007, lng: 88.283, address: 'Tiger Hill Road', category: 'attraction', styles: ['photography', 'nature'] },
    { name: 'Batasia Loop', lat: 27.016, lng: 88.243, address: 'Ghoom', category: 'attraction', styles: ['photography'] },
    { name: 'Happy Valley Tea Estate', lat: 27.048, lng: 88.253, address: 'Lebong Cart Road', category: 'attraction', styles: ['nature'] },
    { name: 'Darjeeling Mall', lat: 27.041, lng: 88.263, address: 'Mall Road', category: 'attraction', styles: ['shopping'] },
  ],
  leh: [
    { name: 'Leh Palace', lat: 34.1659, lng: 77.586, address: 'Old Town, Leh', category: 'attraction', styles: ['history'] },
    { name: 'Shanti Stupa', lat: 34.1735, lng: 77.5752, address: 'Changspa', category: 'attraction', styles: ['culture', 'photography'] },
    { name: 'Thiksey Monastery', lat: 34.055, lng: 77.666, address: 'Thiksey', category: 'attraction', styles: ['culture'] },
    { name: 'Magnetic Hill', lat: 34.165, lng: 77.352, address: 'Leh–Kargil Road', category: 'attraction', styles: ['adventure'] },
  ],
}

const HOTELS: Record<string, Poi[]> = {
  delhi: [
    { name: 'The Imperial New Delhi', lat: 28.6254, lng: 77.2183, address: 'Janpath, New Delhi', category: 'hotel', styles: ['relaxation'] },
    { name: 'Taj Palace New Delhi', lat: 28.5952, lng: 77.1716, address: 'Sardar Patel Marg', category: 'hotel', styles: ['relaxation'] },
    { name: 'The Oberoi New Delhi', lat: 28.5967, lng: 77.2394, address: 'Dr Zakir Hussain Marg', category: 'hotel', styles: ['relaxation'] },
  ],
  mumbai: [
    { name: 'Taj Mahal Palace Mumbai', lat: 18.9217, lng: 72.833, address: 'Apollo Bunder, Colaba', category: 'hotel', styles: ['relaxation'] },
    { name: 'The Oberoi Mumbai', lat: 18.9273, lng: 72.8205, address: 'Nariman Point', category: 'hotel', styles: ['relaxation'] },
    { name: 'Trident Nariman Point', lat: 18.9256, lng: 72.8217, address: 'Nariman Point', category: 'hotel', styles: ['relaxation'] },
  ],
  bengaluru: [
    { name: 'The Oberoi Bengaluru', lat: 12.9733, lng: 77.618, address: 'MG Road', category: 'hotel', styles: ['relaxation'] },
    { name: 'Taj West End', lat: 12.9845, lng: 77.585, address: 'Race Course Road', category: 'hotel', styles: ['relaxation'] },
    { name: 'ITC Gardenia', lat: 12.967, lng: 77.5958, address: 'Residency Road', category: 'hotel', styles: ['relaxation'] },
  ],
  hyderabad: [
    { name: 'Taj Falaknuma Palace', lat: 17.3316, lng: 78.4675, address: 'Falaknuma', category: 'hotel', styles: ['relaxation', 'history'] },
    { name: 'ITC Kakatiya', lat: 17.4239, lng: 78.462, address: 'Begumpet', category: 'hotel', styles: ['relaxation'] },
    { name: 'The Park Hyderabad', lat: 17.423, lng: 78.46, address: 'Somajiguda', category: 'hotel', styles: ['relaxation'] },
  ],
  chennai: [
    { name: 'ITC Grand Chola', lat: 13.0104, lng: 80.2206, address: 'Guindy', category: 'hotel', styles: ['relaxation'] },
    { name: 'The Leela Palace Chennai', lat: 13.0022, lng: 80.2665, address: 'Adyar Seaface', category: 'hotel', styles: ['relaxation'] },
    { name: 'Taj Connemara', lat: 13.066, lng: 80.261, address: 'Binny Road', category: 'hotel', styles: ['relaxation'] },
  ],
  kolkata: [
    { name: 'The Oberoi Grand Kolkata', lat: 22.562, lng: 88.3515, address: 'Chowringhee', category: 'hotel', styles: ['relaxation'] },
    { name: 'ITC Royal Bengal', lat: 22.546, lng: 88.396, address: 'New Town / Science City area', category: 'hotel', styles: ['relaxation'] },
    { name: 'Taj Bengal', lat: 22.5385, lng: 88.351, address: 'Alipore', category: 'hotel', styles: ['relaxation'] },
  ],
  jaipur: [
    { name: 'Rambagh Palace', lat: 26.898, lng: 75.808, address: 'Bhawani Singh Road', category: 'hotel', styles: ['relaxation', 'history'] },
    { name: 'Rajmahal Palace', lat: 26.8988, lng: 75.7905, address: 'Sardar Patel Marg', category: 'hotel', styles: ['relaxation'] },
    { name: 'ITC Rajputana', lat: 26.919, lng: 75.788, address: 'Palace Road', category: 'hotel', styles: ['relaxation'] },
  ],
  agra: [
    { name: 'The Oberoi Amarvilas', lat: 27.1685, lng: 78.0435, address: 'Taj East Gate Road', category: 'hotel', styles: ['relaxation'] },
    { name: 'ITC Mughal Agra', lat: 27.166, lng: 78.018, address: 'Taj Ganj', category: 'hotel', styles: ['relaxation'] },
    { name: 'Taj Hotel & Convention Centre Agra', lat: 27.159, lng: 78.032, address: 'Fatehabad Road', category: 'hotel', styles: ['relaxation'] },
  ],
  varanasi: [
    { name: 'BrijRama Palace', lat: 25.3095, lng: 83.0108, address: 'Munshi Ghat', category: 'hotel', styles: ['relaxation', 'culture'] },
    { name: 'Taj Ganges Varanasi', lat: 25.335, lng: 82.977, address: 'Nadesar Palace Grounds', category: 'hotel', styles: ['relaxation'] },
    { name: 'Ramada Plaza JHV', lat: 25.317, lng: 82.986, address: 'The Mall Road', category: 'hotel', styles: ['relaxation'] },
  ],
  goa: [
    { name: 'Taj Fort Aguada Resort', lat: 15.4945, lng: 73.7732, address: 'Sinquerim, Candolim', category: 'hotel', styles: ['relaxation', 'beaches'] },
    { name: 'Grand Hyatt Goa', lat: 15.391, lng: 73.905, address: 'Bambolim', category: 'hotel', styles: ['relaxation', 'beaches'] },
    { name: 'The Leela Goa', lat: 15.158, lng: 73.957, address: 'Mobor, Cavelossim', category: 'hotel', styles: ['relaxation', 'beaches'] },
  ],
  udaipur: [
    { name: 'Taj Lake Palace', lat: 24.5754, lng: 73.68, address: 'Lake Pichola', category: 'hotel', styles: ['relaxation', 'history'] },
    { name: 'The Oberoi Udaivilas', lat: 24.577, lng: 73.672, address: 'Haridasji Ki Magri', category: 'hotel', styles: ['relaxation'] },
    { name: 'Trident Udaipur', lat: 24.583, lng: 73.68, address: 'Mulla Talai', category: 'hotel', styles: ['relaxation'] },
  ],
  kochi: [
    { name: 'Brunton Boatyard', lat: 9.9682, lng: 76.2422, address: 'Fort Kochi', category: 'hotel', styles: ['relaxation'] },
    { name: 'Taj Malabar Resort & Spa', lat: 9.9665, lng: 76.2438, address: 'Willingdon Island', category: 'hotel', styles: ['relaxation'] },
    { name: 'Grand Hyatt Kochi Bolgatty', lat: 10.016, lng: 76.267, address: 'Bolgatty Island', category: 'hotel', styles: ['relaxation'] },
  ],
  munnar: [
    { name: 'The Windermere Estate', lat: 10.079, lng: 77.062, address: 'Pothamedu', category: 'hotel', styles: ['relaxation', 'nature'] },
    { name: 'Tea County Munnar', lat: 10.089, lng: 77.06, address: 'Munnar town', category: 'hotel', styles: ['relaxation'] },
    { name: 'SpiceTree Munnar', lat: 10.082, lng: 77.04, address: 'Chithirapuram', category: 'hotel', styles: ['relaxation', 'nature'] },
  ],
  pondy: [
    { name: 'Palais de Mahe', lat: 11.9335, lng: 79.8345, address: 'White Town', category: 'hotel', styles: ['relaxation'] },
    { name: 'The Promenade Puducherry', lat: 11.933, lng: 79.8358, address: 'Goubert Avenue', category: 'hotel', styles: ['relaxation'] },
    { name: 'La Villa Puducherry', lat: 11.934, lng: 79.833, address: 'Rue Bussy', category: 'hotel', styles: ['relaxation'] },
  ],
  vizag: [
    { name: 'Novotel Visakhapatnam Varun Beach', lat: 17.7108, lng: 83.3165, address: 'Beach Road', category: 'hotel', styles: ['relaxation', 'beaches'] },
    { name: 'The Park Visakhapatnam', lat: 17.7125, lng: 83.318, address: 'Beach Road', category: 'hotel', styles: ['relaxation'] },
    { name: 'Dolphin Hotel Visakhapatnam', lat: 17.7216, lng: 83.3055, address: 'Dabagardens', category: 'hotel', styles: ['relaxation'] },
  ],
  amritsar: [
    { name: 'Hyatt Regency Amritsar', lat: 31.6348, lng: 74.876, address: 'Ranjit Avenue', category: 'hotel', styles: ['relaxation'] },
    { name: 'Taj Swarna Amritsar', lat: 31.633, lng: 74.874, address: 'City Centre', category: 'hotel', styles: ['relaxation'] },
    { name: 'Ramada Amritsar', lat: 31.64, lng: 74.876, address: 'Mall Road', category: 'hotel', styles: ['relaxation'] },
  ],
  rishikesh: [
    { name: 'Aloha on the Ganges', lat: 30.125, lng: 78.318, address: 'Tapovan', category: 'hotel', styles: ['relaxation'] },
    { name: 'Ganga Kinare', lat: 30.103, lng: 78.31, address: 'Triveni Ghat Road', category: 'hotel', styles: ['relaxation'] },
    { name: 'Ananda in the Himalayas', lat: 30.142, lng: 78.33, address: 'Narendra Nagar (nearby)', category: 'hotel', styles: ['relaxation'] },
  ],
  manali: [
    { name: 'The Himalayan', lat: 32.248, lng: 77.189, address: 'Dhungri', category: 'hotel', styles: ['relaxation'] },
    { name: 'Span Resort & Spa Manali', lat: 32.22, lng: 77.16, address: 'Kullu-Manali Highway', category: 'hotel', styles: ['relaxation'] },
    { name: 'Apple Country Resort', lat: 32.24, lng: 77.189, address: 'Rangri', category: 'hotel', styles: ['relaxation'] },
  ],
  shimla: [
    { name: 'Wildflower Hall', lat: 31.1, lng: 77.24, address: 'Chharabra', category: 'hotel', styles: ['relaxation'] },
    { name: 'Oberoi Cecil', lat: 31.104, lng: 77.166, address: 'Chaura Maidan', category: 'hotel', styles: ['relaxation'] },
    { name: 'Clarkes Hotel Shimla', lat: 31.1048, lng: 77.173, address: 'The Mall', category: 'hotel', styles: ['relaxation'] },
  ],
  mysuru: [
    { name: 'Royal Orchid Metropole', lat: 12.308, lng: 76.655, address: 'Jhansi Lakshmibai Road', category: 'hotel', styles: ['relaxation'] },
    { name: 'Radisson Blu Plaza Mysore', lat: 12.323, lng: 76.626, address: 'Hunsur Road', category: 'hotel', styles: ['relaxation'] },
    { name: 'Grand Mercure Mysore', lat: 12.297, lng: 76.641, address: 'New Bannimantap', category: 'hotel', styles: ['relaxation'] },
  ],
  jaisalmer: [
    { name: 'Suryagarh Jaisalmer', lat: 26.877, lng: 70.885, address: 'Kahala Phata', category: 'hotel', styles: ['relaxation'] },
    { name: 'The Serai Jaisalmer', lat: 26.9, lng: 70.92, address: 'Chawder', category: 'hotel', styles: ['relaxation'] },
    { name: 'Hotel Tokyo Palace', lat: 26.912, lng: 70.916, address: 'Near Fort', category: 'hotel', styles: ['relaxation'] },
  ],
  hampi: [
    { name: 'Evolve Back Hampi', lat: 15.33, lng: 76.47, address: 'Kamalapura', category: 'hotel', styles: ['relaxation'] },
    { name: 'Heritage Resort Hampi', lat: 15.335, lng: 76.47, address: 'Near Virupapur Gaddi', category: 'hotel', styles: ['relaxation'] },
    { name: 'Hyatt Place Hampi', lat: 15.34, lng: 76.46, address: 'Kamalapura', category: 'hotel', styles: ['relaxation'] },
  ],
  pune: [
    { name: 'The Westin Pune Koregaon Park', lat: 18.536, lng: 73.896, address: 'Koregaon Park', category: 'hotel', styles: ['relaxation'] },
    { name: 'JW Marriott Pune', lat: 18.532, lng: 73.829, address: 'Senapati Bapat Road', category: 'hotel', styles: ['relaxation'] },
    { name: 'Conrad Pune', lat: 18.533, lng: 73.877, address: 'Mangaldas Road', category: 'hotel', styles: ['relaxation'] },
  ],
  darjeeling: [
    { name: 'Mayfair Darjeeling', lat: 27.048, lng: 88.263, address: 'The Mall', category: 'hotel', styles: ['relaxation'] },
    { name: 'Windamere Hotel', lat: 27.046, lng: 88.263, address: 'Observatory Hill', category: 'hotel', styles: ['relaxation'] },
    { name: 'Elgin Darjeeling', lat: 27.041, lng: 88.266, address: 'HD Lama Road', category: 'hotel', styles: ['relaxation'] },
  ],
  leh: [
    { name: 'The Grand Dragon Ladakh', lat: 34.152, lng: 77.577, address: 'Old Road, Leh', category: 'hotel', styles: ['relaxation'] },
    { name: 'The Ladakh', lat: 34.164, lng: 77.584, address: 'Fort Road', category: 'hotel', styles: ['relaxation'] },
    { name: 'Hotel Grand Himalaya', lat: 34.165, lng: 77.583, address: 'Fort Road', category: 'hotel', styles: ['relaxation'] },
  ],
}

export function landmarksAsPlaces(destinationId: string): Place[] {
  const dest = getDestination(destinationId)
  const list = [...(POIS[destinationId] ?? []), ...(HOTELS[destinationId] ?? [])]
  const places: Place[] = list.map((p, i) => ({
    id: `poi_${destinationId}_${i}`,
    destinationId,
    name: p.name,
    category: p.category,
    styles: p.styles,
    description: `${p.name} is a signature ${p.category === 'hotel' ? 'stay' : 'stop'} in ${dest.name}.`,
    rating: 0,
    reviewCount: 0,
    image: p.category === 'hotel' ? satellitePhoto(p.lat, p.lng) : dest.image || satellitePhoto(p.lat, p.lng),
    images: dest.image ? [dest.image] : [],
    lat: p.lat,
    lng: p.lng,
    address: p.address,
    openingHours: 'Check locally',
    opensAt: 9,
    closesAt: 18,
    entryFee: 0,
    bestTime: 'Morning',
    crowd: 'moderate',
    crowdNote: '',
    durationMin: p.durationMin ?? (p.category === 'attraction' ? 75 : 45),
    estimatedCost: 0,
    indoor: Boolean(p.indoor),
    weatherSensitive: !p.indoor && p.category === 'attraction',
    tags: [p.category === 'hotel' ? 'hotel' : 'landmark', destinationId],
    source: 'catalog',
    ratingKnown: false,
    hoursKnown: false,
    priceKnown: false,
    crowdKnown: false,
    imageKnown: true,
  }))
  if (places.length) registerPlaces(places)
  return places
}

/** Landmarks always win; OSM extras must actually sit near this city. */
export function placesForTrip(destinationId: string, origin: LatLng, osm: Place[], radiusKm: number): Place[] {
  const landmarks = landmarksAsPlaces(destinationId)
  const localOsm = osm.filter((p) => haversineKm(origin, p) <= radiusKm)
  const seen = new Set<string>()
  const out: Place[] = []
  for (const p of [...landmarks, ...localOsm]) {
    const name = p.name.trim().toLowerCase()
    if (seen.has(p.id) || seen.has(name)) continue
    seen.add(p.id)
    seen.add(name)
    out.push(p)
  }
  registerPlaces(out)
  return out
}

export function hotelsAsPlaces(destinationId: string) {
  return landmarksAsPlaces(destinationId).filter((p) => p.category === 'hotel')
}
