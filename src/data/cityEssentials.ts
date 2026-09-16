import { catalogParentCity, findDestination, getDestination } from '@/data/destinations'
import { registerPlaces } from '@/data/places'
import { satellitePhoto } from '@/lib/media'
import type { Place } from '@/types'

/** Official reservation numbers / brand sites. Confirm on the website before you call. */
export const HOTEL_CONTACTS: Record<string, { phone: string; website: string }> = {
  'The Imperial New Delhi': { phone: '+91 11 2334 1234', website: 'https://www.theimperialindia.com' },
  'Taj Palace New Delhi': { phone: '+91 11 2611 0202', website: 'https://www.tajhotels.com/en-in/hotels/taj-palace-new-delhi' },
  'The Oberoi New Delhi': { phone: '+91 11 2436 3030', website: 'https://www.oberoihotels.com/hotels-in-new-delhi' },
  'Taj Mahal Palace Mumbai': { phone: '+91 22 6665 3366', website: 'https://www.tajhotels.com/en-in/hotels/taj-mahal-palace-mumbai' },
  'The Oberoi Mumbai': { phone: '+91 22 6632 5757', website: 'https://www.oberoihotels.com/hotels-in-mumbai' },
  'Trident Nariman Point': { phone: '+91 22 6632 4343', website: 'https://www.tridenthotels.com/hotels-in-mumbai-nariman-point' },
  'The Oberoi Bengaluru': { phone: '+91 80 2558 5858', website: 'https://www.oberoihotels.com/hotels-in-bengaluru' },
  'Taj West End': { phone: '+91 80 6660 5660', website: 'https://www.tajhotels.com/en-in/hotels/taj-west-end-bengaluru' },
  'ITC Gardenia': { phone: '+91 80 2211 9898', website: 'https://www.itchotels.com/in/en/itcgardenia-bengaluru' },
  'Taj Falaknuma Palace': { phone: '+91 40 6629 8585', website: 'https://www.tajhotels.com/en-in/hotels/taj-falaknuma-palace-hyderabad' },
  'ITC Kakatiya': { phone: '+91 40 4008 1818', website: 'https://www.itchotels.com/in/en/itckakatiya-hyderabad' },
  'The Park Hyderabad': { phone: '+91 40 2345 6789', website: 'https://www.theparkhotels.com/hyderabad' },
  'ITC Grand Chola': { phone: '+91 44 2220 0000', website: 'https://www.itchotels.com/in/en/itcgrandchola-chennai' },
  'The Leela Palace Chennai': { phone: '+91 44 3366 1234', website: 'https://www.theleela.com/the-leela-palace-chennai' },
  'Taj Connemara': { phone: '+91 44 6600 0000', website: 'https://www.tajhotels.com/en-in/hotels/taj-connemara-chennai' },
  'The Oberoi Grand Kolkata': { phone: '+91 33 2249 2323', website: 'https://www.oberoihotels.com/hotels-in-kolkata' },
  'ITC Royal Bengal': { phone: '+91 33 4446 4646', website: 'https://www.itchotels.com/in/en/itcroyalbengal-kolkata' },
  'Taj Bengal': { phone: '+91 33 6612 3939', website: 'https://www.tajhotels.com/en-in/hotels/taj-bengal-kolkata' },
  'Rambagh Palace': { phone: '+91 141 238 5700', website: 'https://www.tajhotels.com/en-in/hotels/rambagh-palace-jaipur' },
  'Rajmahal Palace': { phone: '+91 141 403 3600', website: 'https://www.sujanluxury.com/rajmahal-palace' },
  'ITC Rajputana': { phone: '+91 141 510 0100', website: 'https://www.itchotels.com/in/en/itcrajputana-jaipur' },
  'The Oberoi Amarvilas': { phone: '+91 562 223 1515', website: 'https://www.oberoihotels.com/hotels-in-agra-amarvilas' },
  'ITC Mughal Agra': { phone: '+91 562 402 1700', website: 'https://www.itchotels.com/in/en/itcmughal-agra' },
  'Taj Hotel & Convention Centre Agra': { phone: '+91 562 223 4000', website: 'https://www.tajhotels.com/en-in/hotels/taj-hotel-convention-centre-agra' },
  'BrijRama Palace': { phone: '+91 542 239 3000', website: 'https://www.brijrama.com' },
  'Taj Ganges Varanasi': { phone: '+91 542 239 3001', website: 'https://www.tajhotels.com/en-in/hotels/taj-ganges-varanasi' },
  'Ramada Plaza JHV': { phone: '+91 542 250 3000', website: 'https://www.wyndhamhotels.com' },
  'Taj Fort Aguada Resort': { phone: '+91 832 664 5858', website: 'https://www.tajhotels.com/en-in/hotels/taj-fort-aguada-resort-spa-goa' },
  'Grand Hyatt Goa': { phone: '+91 832 301 1234', website: 'https://www.hyatt.com/grand-hyatt/goagh-grand-hyatt-goa' },
  'The Leela Goa': { phone: '+91 832 662 1234', website: 'https://www.theleela.com/the-leela-goa' },
  'Taj Lake Palace': { phone: '+91 294 242 8800', website: 'https://www.tajhotels.com/en-in/hotels/taj-lake-palace-udaipur' },
  'The Oberoi Udaivilas': { phone: '+91 294 243 3300', website: 'https://www.oberoihotels.com/hotels-in-udaipur-udaivilas' },
  'Trident Udaipur': { phone: '+91 294 243 2200', website: 'https://www.tridenthotels.com/hotels-in-udaipur' },
  'Brunton Boatyard': { phone: '+91 484 221 5461', website: 'https://cghearth.com/brunton-boatyard' },
  'Taj Malabar Resort & Spa': { phone: '+91 484 664 3000', website: 'https://www.tajhotels.com/en-in/hotels/taj-malabar-resort-spa-kochi' },
  'Grand Hyatt Kochi Bolgatty': { phone: '+91 484 266 1234', website: 'https://www.hyatt.com/grand-hyatt/cokgh-grand-hyatt-kochi-bolgatty' },
  'The Windermere Estate': { phone: '+91 486 523 0512', website: 'https://www.windermeremunnar.com' },
  'Tea County Munnar': { phone: '+91 486 523 0460', website: 'https://www.ktcindia.com' },
  'SpiceTree Munnar': { phone: '+91 484 414 1414', website: 'https://www.spicetreemunnar.com' },
  'Palais de Mahe': { phone: '+91 413 234 5611', website: 'https://www.cghearth.com/palais-de-mahe' },
  'The Promenade Puducherry': { phone: '+91 413 222 7750', website: 'https://www.promenadehotelpondicherry.com' },
  'La Villa Puducherry': { phone: '+91 413 262 2012', website: 'https://lavillapondicherry.com' },
  'Novotel Visakhapatnam Varun Beach': { phone: '+91 891 282 2222', website: 'https://all.accor.com/hotel/7946/index.en.shtml' },
  'The Park Visakhapatnam': { phone: '+91 891 304 5678', website: 'https://www.theparkhotels.com/visakhapatnam' },
  'Dolphin Hotel Visakhapatnam': { phone: '+91 891 256 7000', website: 'https://www.dolphinhotelsvizag.com' },
  'Hyatt Regency Amritsar': { phone: '+91 183 285 1234', website: 'https://www.hyatt.com/hyatt-regency/atxra-hyatt-regency-amritsar' },
  'Taj Swarna Amritsar': { phone: '+91 183 505 0000', website: 'https://www.tajhotels.com/en-in/hotels/taj-swarna-amritsar' },
  'Ramada Amritsar': { phone: '+91 183 502 8888', website: 'https://www.wyndhamhotels.com' },
  'Aloha on the Ganges': { phone: '+91 135 244 0088', website: 'https://www.alohaontheganges.com' },
  'Ganga Kinare': { phone: '+91 135 243 5800', website: 'https://www.gangakinare.com' },
  'Ananda in the Himalayas': { phone: '+91 1378 227 500', website: 'https://www.anandaspa.com' },
  'The Himalayan': { phone: '+91 1902 250 002', website: 'https://www.thehimalayan.com' },
  'Span Resort & Spa Manali': { phone: '+91 1902 237 524', website: 'https://www.spanresorts.com' },
  'Apple Country Resort': { phone: '+91 1902 252 501', website: 'https://www.applecountryresort.com' },
  'Wildflower Hall': { phone: '+91 177 264 8585', website: 'https://www.oberoihotels.com/hotels-in-shimla-wildflower-hall' },
  'Oberoi Cecil': { phone: '+91 177 280 4848', website: 'https://www.oberoihotels.com/hotels-in-shimla-cecil' },
  'Clarkes Hotel Shimla': { phone: '+91 177 265 1010', website: 'https://www.clarkeshotel.com' },
  'Royal Orchid Metropole': { phone: '+91 821 425 5555', website: 'https://www.royalorchidhotels.com' },
  'Radisson Blu Plaza Mysore': { phone: '+91 821 710 1234', website: 'https://www.radissonhotels.com' },
  'Grand Mercure Mysore': { phone: '+91 821 710 7100', website: 'https://all.accor.com' },
  'Suryagarh Jaisalmer': { phone: '+91 2992 269 269', website: 'https://www.suryagarh.com' },
  'The Serai Jaisalmer': { phone: '+91 2992 264 480', website: 'https://www.sujanluxury.com/the-serai' },
  'Hotel Tokyo Palace': { phone: '+91 2992 255 407', website: 'https://www.tokyopalace.net' },
  'Evolve Back Hampi': { phone: '+91 80 4618 4444', website: 'https://www.evolveback.com/hampi' },
  'Heritage Resort Hampi': { phone: '+91 8394 241 222', website: 'https://www.heritageresorthampi.com' },
  'Hyatt Place Hampi': { phone: '+91 8394 240 123', website: 'https://www.hyatt.com' },
  'The Westin Pune Koregaon Park': { phone: '+91 20 6721 0000', website: 'https://www.marriott.com' },
  'JW Marriott Pune': { phone: '+91 20 6683 3333', website: 'https://www.marriott.com' },
  'Conrad Pune': { phone: '+91 20 6745 6789', website: 'https://www.hilton.com' },
  'Mayfair Darjeeling': { phone: '+91 354 225 6376', website: 'https://www.mayfairhotels.com/mayfair-darjeeling' },
  'Windamere Hotel': { phone: '+91 354 225 4041', website: 'https://www.windamerehotel.com' },
  'Elgin Darjeeling': { phone: '+91 354 225 7226', website: 'https://www.elginhotels.com' },
  'The Grand Dragon Ladakh': { phone: '+91 1982 257 786', website: 'https://www.thegranddragonladakh.com' },
  'The Ladakh': { phone: '+91 1982 252 372', website: 'https://www.theladakh.com' },
  'Hotel Grand Himalaya': { phone: '+91 1982 252 111', website: 'https://www.hotelgrandhimalaya.com' },
}

export type CityFood = {
  dish: string
  why: string
  place: string
  address: string
  lat: number
  lng: number
  phone?: string
  website?: string
}

/** Famous dishes + a real hall or stall where first-timers actually eat them. */
export const CITY_FOODS: Record<string, CityFood[]> = {
  delhi: [
    { dish: 'Chole bhature', why: 'The Delhi breakfast everyone points you to.', place: 'Sita Ram Diwan Chand', address: 'Paharganj, New Delhi', lat: 28.6448, lng: 77.2167, phone: '+91 11 2358 8756' },
    { dish: 'Old Delhi Mughlai', why: 'Kebabs and korma since 1913 next to Jama Masjid.', place: "Karim's", address: 'Jama Masjid, Old Delhi', lat: 28.6496, lng: 77.2335, phone: '+91 11 2326 4981', website: 'https://www.karimhoteldelhi.com' },
    { dish: 'Street chaat', why: 'Dahi bhalla and aloo tikki in the lanes.', place: 'Chandni Chowk food stretch', address: 'Chandni Chowk, Delhi', lat: 28.6506, lng: 77.2303 },
  ],
  mumbai: [
    { dish: 'Vada pav', why: 'The city’s everyday snack — spicy potato fritter in a bun.', place: 'Ashok Vada Pav', address: 'Kirti College, Dadar West', lat: 19.0223, lng: 72.838 },
    { dish: 'Irani cafe + berry pulao', why: 'Parsi room, berry pulao and raspberry soda.', place: 'Britannia & Co.', address: 'Ballard Estate, Fort', lat: 18.936, lng: 72.838, phone: '+91 22 2261 5264' },
    { dish: 'Late-night kebabs', why: 'Colaba after the Gateway.', place: 'Bademiya', address: 'Tulloch Road, Colaba', lat: 18.9218, lng: 72.832, phone: '+91 22 2202 1447' },
  ],
  bengaluru: [
    { dish: 'Masala dosa + filter coffee', why: 'The first meal that makes the city click.', place: 'Vidyarthi Bhavan', address: 'Gandhi Bazaar, Basavanagudi', lat: 12.943, lng: 77.571, phone: '+91 80 2667 7588' },
    { dish: 'Bisi bele bath', why: 'Hot rice, lentils, vegetables — a Karnataka staple.', place: 'CTR / Shri Sagar', address: 'Malleshwaram', lat: 13.006, lng: 77.569 },
    { dish: 'Darshini breakfast', why: 'Stand-up counters, steel plates, no fuss.', place: 'Central Tiffin Room area', address: 'Malleshwaram 8th Cross', lat: 13.0058, lng: 77.5694 },
  ],
  hyderabad: [
    { dish: 'Hyderabadi dum biryani', why: 'The dish the city is named for in every food chat.', place: 'Paradise Biryani', address: 'Secunderabad / multiple halls', lat: 17.4399, lng: 78.4983, website: 'https://www.paradisefoodcourt.in' },
    { dish: 'Haleem (in season)', why: 'Slow-cooked, especially around Ramadan.', place: 'Pista House', address: 'Shalibanda / city branches', lat: 17.361, lng: 78.474 },
    { dish: 'Irani chai + osmania biscuit', why: 'Old-city cafe pause.', place: 'Nimrah Cafe', address: 'Charminar', lat: 17.3616, lng: 78.4747 },
  ],
  chennai: [
    { dish: 'Idli, sambar, filter coffee', why: 'Soft, sour, and the safest first meal.', place: 'Murugan Idli Shop', address: 'GN Chetty Road / city branches', lat: 13.041, lng: 80.233 },
    { dish: 'Chettinad pepper chicken', why: 'If you want spice with a story.', place: 'Anjappar', address: 'City branches', lat: 13.056, lng: 80.243 },
    { dish: 'Marina evening snack', why: 'Sundal and sliced mango on the sand.', place: 'Marina Beach stalls', address: 'Kamarajar Salai', lat: 13.05, lng: 80.2824 },
  ],
  madurai: [
    { dish: 'Jigarthanda', why: 'The city’s cooling drink — almond milk, nannari, ice cream.', place: 'Famous Jigarthanda', address: 'East Masi Street, Madurai', lat: 9.9194, lng: 78.1196 },
    { dish: 'Kari dosai', why: 'Mutton-stuffed dosa, a Madurai night classic.', place: 'Konar Kadai', address: 'South Avani Moola Street', lat: 9.9198, lng: 78.1192 },
    { dish: 'Idli + filter coffee', why: 'Soft idlis before the Meenakshi temple circuit.', place: 'Murugan Idli Shop', address: 'West Masi Street', lat: 9.9195, lng: 78.1145 },
  ],
  kolkata: [
    { dish: 'Kathi roll', why: 'Kolkata invented the wrapped kebab.', place: 'Nizam’s', address: 'Hogg Street, New Market', lat: 22.56, lng: 88.353 },
    { dish: 'Bengali thali + mishti', why: 'Fish or veg thali, then rosogolla.', place: '6 Ballygunge Place', address: 'Ballygunge', lat: 22.527, lng: 88.363, website: 'https://www.6ballygungeplace.in' },
    { dish: 'Phuchka', why: 'Street puchka is the local pani puri.', place: 'Lakes / Vivekananda Park stretch', address: 'Southern Avenue', lat: 22.513, lng: 88.353 },
  ],
  jaipur: [
    { dish: 'Dal baati churma', why: 'The Rajasthani plate you came for.', place: 'LMB / Johari Bazaar halls', address: 'Johari Bazaar', lat: 26.923, lng: 75.826 },
    { dish: 'Pyaaz kachori', why: 'Breakfast pastry, onion filling.', place: 'Rawat Mishthan Bhandar', address: 'Station Road, Jaipur', lat: 26.92, lng: 75.788, phone: '+91 141 236 5014' },
    { dish: 'Ghewar', why: 'Honeycomb sweet — best in monsoon, sold year-round.', place: 'Laxmi Misthan Bhandar', address: 'Johari Bazaar', lat: 26.9235, lng: 75.8265 },
  ],
  agra: [
    { dish: 'Mughlai thali', why: 'Eat after the Taj, not from a tout at the gate.', place: 'Pinch of Spice', address: 'Fatehabad Road', lat: 27.16, lng: 78.04, website: 'https://www.pinchofspice.in' },
    { dish: 'Agra petha', why: 'Ash-gourd sweet the city is famous for.', place: 'Panchhi Petha', address: 'Sadar Bazaar / city shops', lat: 27.176, lng: 78.008 },
    { dish: 'Bedai + jalebi', why: 'Local breakfast if you start before sunrise.', place: 'Sadar Bazaar stalls', address: 'Sadar, Agra', lat: 27.1767, lng: 78.0081 },
  ],
  varanasi: [
    { dish: 'Kachori sabzi + jalebi', why: 'The ghat-town breakfast.', place: 'Ram Bhandar', address: 'Thatheri Bazaar', lat: 25.318, lng: 83.01 },
    { dish: 'Banarasi lassi', why: 'Thick, clay-cup, after the morning walk.', place: 'Blue Lassi', address: 'Near Vishwanath Gali', lat: 25.3105, lng: 83.0105 },
    { dish: 'Tamatar chaat', why: 'Only here — warm tomato chaat.', place: 'Deena Chaat Bhandar', address: 'Dashashwamedh Road', lat: 25.307, lng: 83.01 },
  ],
  goa: [
    { dish: 'Fish curry rice', why: 'The Goan plate. Ask for medium spice.', place: 'Mum’s Kitchen', address: 'Panaji', lat: 15.49, lng: 73.827, website: 'https://www.mumskitchengoa.com' },
    { dish: 'Prawn balchão / xacuti', why: 'Vinegar heat or coconut gravy.', place: 'Viva Panjim', address: '31st January Road, Fontainhas', lat: 15.498, lng: 73.828 },
    { dish: 'Bebinca', why: 'Layered egg dessert after dinner.', place: 'Panaji bakeries / hotel dessert counters', address: 'Panaji', lat: 15.4909, lng: 73.8278 },
  ],
  udaipur: [
    { dish: 'Dal baati by the lake', why: 'Same Rajasthani plate, quieter setting.', place: 'Natraj Dining Hall', address: 'City Station Road', lat: 24.576, lng: 73.697 },
    { dish: 'Mirchi vada', why: 'Stuffed chilli snack in the old city.', place: 'Jagdish Chowk stalls', address: 'Old City', lat: 24.5797, lng: 73.6839 },
    { dish: 'Lakeside thali', why: 'Eat where locals sit, not only for the view.', place: 'Ambrai / ghat-side halls', address: 'Amet Ghat', lat: 24.577, lng: 73.681 },
  ],
  kochi: [
    { dish: 'Kerala meals', why: 'Rice, sambar, thoran, pickle, papadam.', place: 'Grand Hotel restaurant', address: 'MG Road, Ernakulam', lat: 9.981, lng: 76.282 },
    { dish: 'Karimeen pollichathu', why: 'Pearl spot in banana leaf — order if you eat fish.', place: 'Fort Kochi seafood rooms', address: 'Fort Kochi', lat: 9.965, lng: 76.242 },
    { dish: 'Appam + stew', why: 'Soft hoppers, mild coconut stew.', place: 'Kashi Art Cafe', address: 'Burgher Street, Fort Kochi', lat: 9.966, lng: 76.243 },
  ],
  munnar: [
    { dish: 'Estate tea + Kerala breakfast', why: 'Puttu or appam after a cool night.', place: 'Tea County restaurant', address: 'Munnar town', lat: 10.089, lng: 77.06 },
    { dish: 'Cardamom / tea-estate cafe', why: 'Taste what the hills grow.', place: 'Lockhart Tea Factory area', address: 'Munnar–Theni road', lat: 10.05, lng: 77.08 },
    { dish: 'Home-style Kerala meals', why: 'Rice and thoran, less tourist-shack.', place: 'Rapsy Restaurant', address: 'Munnar bazaar', lat: 10.088, lng: 77.06 },
  ],
  pondy: [
    { dish: 'Tamil breakfast + croissant', why: 'The town is both.', place: 'Café des Arts', address: 'Suffren Street, White Town', lat: 11.934, lng: 79.834 },
    { dish: 'Seafood thali', why: 'Bay catch, French-quarter evening.', place: 'Villa Shanti', address: 'Suffren Street', lat: 11.9345, lng: 79.8342 },
    { dish: 'Filter coffee', why: 'After the promenade walk.', place: 'Baker Street / White Town cafes', address: 'White Town', lat: 11.933, lng: 79.835 },
  ],
  vizag: [
    { dish: 'Andhra meals + pulihora', why: 'Tamarind rice and a veg thali by the coast.', place: 'Raju Gari Dhaba / Beach Road halls', address: 'Beach Road', lat: 17.72, lng: 83.318 },
    { dish: 'Chapala pulusu', why: 'Coastal fish curry if you eat seafood.', place: 'My Restaurant / coastal rooms', address: 'MVP / Beach Road', lat: 17.73, lng: 83.32 },
    { dish: 'Pootharekulu', why: 'Paper-thin sweet from nearby Atreyapuram, sold in town.', place: 'RK Beach sweet stalls', address: 'Beach Road', lat: 17.7142, lng: 83.3187 },
  ],
  amritsar: [
    { dish: 'Amritsari kulcha', why: 'Stuffed bread, chole, butter — eat it once.', place: 'Brother’s Dhaba', address: 'Town Hall, near Golden Temple', lat: 31.625, lng: 74.879, phone: '+91 183 255 2110' },
    { dish: 'Langar at Harmandir Sahib', why: 'Free community meal. Cover your head. Sit on the floor.', place: 'Golden Temple langar', address: 'Golden Temple complex', lat: 31.62, lng: 74.8765 },
    { dish: 'Lassi + jalebi', why: 'After the kulcha.', place: 'Ahuja Lassi / old city', address: 'Near Town Hall', lat: 31.6255, lng: 74.8785 },
  ],
  rishikesh: [
    { dish: 'Cafe thali / Israeli plate', why: 'Tapovan cafes after the Ganga walk.', place: 'Ram Jhula / Tapovan cafes', address: 'Tapovan', lat: 30.123, lng: 78.314 },
    { dish: 'Aloo puri', why: 'Simple, filling, everywhere near the ghats.', place: 'Triveni Ghat stalls', address: 'Triveni Ghat', lat: 30.103, lng: 78.31 },
    { dish: 'Chai on the river', why: 'Skip alcohol on day one if you just arrived from a long flight.', place: 'Laxman Jhula cafe strip', address: 'Laxman Jhula', lat: 30.126, lng: 78.33 },
  ],
  manali: [
    { dish: 'Himachali dham / siddu', why: 'Steamed bread and local dal if you find it.', place: 'Old Manali cafes', address: 'Old Manali', lat: 32.243, lng: 77.188 },
    { dish: 'Trout', why: 'River fish in season, in the valley restaurants.', place: 'Johnson’s Cafe', address: 'Circuit House Road', lat: 32.24, lng: 77.189 },
    { dish: 'Tibetan momos', why: 'Easy first dinner in the cold.', place: 'Mall Road / Old Manali', address: 'Manali', lat: 32.2396, lng: 77.1887 },
  ],
  shimla: [
    { dish: 'Himachali thali', why: 'Madra, siddu, local dal.', place: 'Ashiana / The Mall', address: 'The Mall, Shimla', lat: 31.1048, lng: 77.1734 },
    { dish: 'Bun-samosa + chai', why: 'The Mall snack.', place: 'Indian Coffee House', address: 'The Mall', lat: 31.1045, lng: 77.173 },
    { dish: 'Bal mitthai (from nearby)', why: 'Milk sweet sold in hill shops.', place: 'Mall Road sweet shops', address: 'The Mall', lat: 31.1048, lng: 77.1734 },
  ],
  mysuru: [
    { dish: 'Mysore masala dosa', why: 'Red chutney baked into the dosa.', place: 'Hotel Mylari', address: 'Nazarbad', lat: 12.31, lng: 76.655 },
    { dish: 'Mysore pak', why: 'The city’s namesake sweet. Buy packed for the flight home.', place: 'Guru Sweets / market', address: 'Devaraja Market area', lat: 12.309, lng: 76.655 },
    { dish: 'Filter coffee', why: 'After the palace.', place: 'Gayatri Tiffin / city darshinis', address: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  ],
  jaisalmer: [
    { dish: 'Ker sangri + bajra', why: 'Desert vegetables and millet — the real local plate.', place: 'Desert Boy’s Dhani', address: 'Near Fort / city', lat: 26.915, lng: 70.912 },
    { dish: 'Rajasthani thali', why: 'Safer than random fort-roof touts.', place: 'Saffron / fort-adjacent halls', address: 'Fort road', lat: 26.9157, lng: 70.9083 },
    { dish: 'Makhaniya lassi', why: 'Thick, after the afternoon fort.', place: 'Bhatia’s', address: 'Near Fort gate', lat: 26.914, lng: 70.912 },
  ],
  hampi: [
    { dish: 'South Indian thali', why: 'After temple-hopping in the heat.', place: 'Mango Tree (confirm current location)', address: 'Hampi Bazaar side', lat: 15.335, lng: 76.46 },
    { dish: 'Banana-leaf meals', why: 'Rice, sambar, palya.', place: 'Hampi Bazaar canteens', address: 'Hampi Bazaar', lat: 15.3355, lng: 76.461 },
    { dish: 'Coconut water', why: 'Heat is the real enemy here.', place: 'Bazaar stalls', address: 'Hampi', lat: 15.335, lng: 76.46 },
  ],
  pune: [
    { dish: 'Misal pav', why: 'Sprouts curry, farsan, pav — spicy. Ask for less spice.', place: 'Bedekar Misal', address: 'Narayan Peth', lat: 18.516, lng: 73.85 },
    { dish: 'Maharashtrian thali', why: 'Puran poli if you are lucky.', place: 'Shreyas / city thali rooms', address: 'Deccan / FC Road side', lat: 18.519, lng: 73.843 },
    { dish: 'Bhel / street evening', why: 'FC Road after 6 pm.', place: 'FC Road stalls', address: 'FC Road', lat: 18.52, lng: 73.841 },
  ],
  darjeeling: [
    { dish: 'Darjeeling tea', why: 'Taste it at source, not only in a bag.', place: 'Glenary’s', address: 'The Mall', lat: 27.043, lng: 88.266, phone: '+91 354 225 4122' },
    { dish: 'Thukpa / momos', why: 'Warm, after the Mall walk.', place: 'Keventer’s / Mall cafes', address: 'The Mall', lat: 27.041, lng: 88.263 },
    { dish: 'Kinema / hill thali', why: 'Local fermented soya if you want the real plate.', place: 'Local kitchens around Chowrasta', address: 'Chowrasta', lat: 27.0415, lng: 88.2635 },
  ],
  leh: [
    { dish: 'Thukpa / skiu', why: 'Light food on day 1–2. Altitude first.', place: 'Main Bazaar kitchens', address: 'Leh Main Bazaar', lat: 34.164, lng: 77.584 },
    { dish: 'Butter tea', why: 'Salty, warm — try a cup, not a litre.', place: 'Changspa cafes', address: 'Changspa', lat: 34.166, lng: 77.58 },
    { dish: 'Apricot jam + simple rice', why: 'Do not eat a heavy biryani the night you land.', place: 'Hotel / guest-house kitchen', address: 'Leh town', lat: 34.1526, lng: 77.5771 },
  ],
}

export function applyHotelContact<T extends { name: string; phone?: string; website?: string }>(place: T): T {
  const hit = HOTEL_CONTACTS[place.name]
  if (!hit) return place
  return { ...place, phone: place.phone || hit.phone, website: place.website || hit.website }
}

const FOOD_ALIASES: Record<string, string> = {
  'new delhi': 'delhi',
  delhi: 'delhi',
  bangalore: 'bengaluru',
  bengaluru: 'bengaluru',
  bombay: 'mumbai',
  mumbai: 'mumbai',
  madras: 'chennai',
  chennai: 'chennai',
  calcutta: 'kolkata',
  kolkata: 'kolkata',
  benares: 'varanasi',
  varanasi: 'varanasi',
  visakhapatnam: 'vizag',
  vizag: 'vizag',
  madhurai: 'madurai',
  madurai: 'madurai',
}

export function foodCityId(destinationId: string) {
  if (CITY_FOODS[destinationId]) return destinationId
  const d = findDestination(destinationId)
  if (!d) return destinationId
  const parent = catalogParentCity(d, `${d.displayName ?? ''} ${d.name}`)
  if (parent && CITY_FOODS[parent.id]) return parent.id
  const name = (d.city || d.name || '').toLowerCase().trim()
  if (FOOD_ALIASES[name]) return FOOD_ALIASES[name]
  const first = name.replace(/\b(lane|street|road|nagar|colony|layout|sector|block|avenue|marg)\b/gi, ' ').split(/[,\s]+/)[0]
  if (FOOD_ALIASES[first]) return FOOD_ALIASES[first]
  const keys = Object.keys(CITY_FOODS)
  const hit = keys.find((k) => name === k || name.includes(k) || k.includes(name.replace(/\s+/g, '')))
  return hit || destinationId
}

export function foodsAsPlaces(destinationId: string): Place[] {
  const dest = findDestination(destinationId) ?? getDestination(destinationId)
  const list = CITY_FOODS[foodCityId(destinationId)] ?? []
  const places: Place[] = list.map((f, i) => ({
    id: `food_${destinationId}_${i}`,
    destinationId,
    name: f.place,
    category: 'restaurant',
    styles: ['food'],
    description: `${f.dish} — ${f.why}`,
    rating: 0,
    reviewCount: 0,
    image: dest.image || satellitePhoto(f.lat, f.lng),
    images: dest.image ? [dest.image] : [],
    lat: f.lat,
    lng: f.lng,
    address: f.address,
    openingHours: 'Check locally',
    opensAt: 8,
    closesAt: 22,
    entryFee: 0,
    bestTime: 'Meal time',
    crowd: 'moderate',
    crowdNote: '',
    durationMin: 50,
    estimatedCost: 0,
    indoor: true,
    weatherSensitive: false,
    tags: ['food', 'famous', destinationId],
    source: 'catalog',
    phone: f.phone,
    website: f.website,
    ratingKnown: false,
    hoursKnown: false,
    priceKnown: false,
    crowdKnown: false,
    imageKnown: true,
  }))
  if (places.length) registerPlaces(places)
  return places
}

export function formatFoodLine(cityId: string) {
  return (CITY_FOODS[cityId] ?? []).map((f) => `${f.dish} at ${f.place}`).join('; ')
}

export function formatHotelLine(cityId: string, names: string[]) {
  return names
    .map((n) => {
      const c = HOTEL_CONTACTS[n]
      return c ? `${n} — ${c.phone} · ${c.website}` : n
    })
    .join('\n')
}
