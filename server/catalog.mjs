/** City food / hotel contacts used by the companion API. */

export const CITY_PICKS = {
  delhi: {
    foods: [
      { dish: 'Chole bhature', place: 'Sita Ram Diwan Chand, Paharganj', phone: '+91 11 2358 8756' },
      { dish: 'Old Delhi Mughlai', place: "Karim's, Jama Masjid", phone: '+91 11 2326 4981', website: 'https://www.karimhoteldelhi.com' },
      { dish: 'Street chaat', place: 'Chandni Chowk food stretch' },
    ],
    hotels: [
      { name: 'The Oberoi New Delhi', phone: '+91 11 2436 3030', website: 'https://www.oberoihotels.com/hotels-in-new-delhi', area: 'Dr Zakir Hussain Marg' },
      { name: 'Taj Palace New Delhi', phone: '+91 11 2611 0202', website: 'https://www.tajhotels.com/en-in/hotels/taj-palace-new-delhi', area: 'Sardar Patel Marg' },
      { name: 'The Imperial New Delhi', phone: '+91 11 2334 1234', website: 'https://www.theimperialindia.com', area: 'Janpath' },
    ],
  },
  mumbai: {
    foods: [
      { dish: 'Vada pav', place: 'Ashok Vada Pav, Dadar West' },
      { dish: 'Parsi berry pulao', place: 'Britannia & Co., Fort', phone: '+91 22 2261 5264' },
      { dish: 'Late-night kebabs', place: 'Bademiya, Colaba', phone: '+91 22 2202 1447' },
    ],
    hotels: [
      { name: 'Taj Mahal Palace Mumbai', phone: '+91 22 6665 3366', website: 'https://www.tajhotels.com/en-in/hotels/taj-mahal-palace-mumbai', area: 'Colaba' },
      { name: 'The Oberoi Mumbai', phone: '+91 22 6632 5757', website: 'https://www.oberoihotels.com/hotels-in-mumbai', area: 'Nariman Point' },
      { name: 'Trident Nariman Point', phone: '+91 22 6632 4343', website: 'https://www.tridenthotels.com/hotels-in-mumbai-nariman-point', area: 'Nariman Point' },
    ],
  },
  bengaluru: {
    foods: [
      { dish: 'Masala dosa + filter coffee', place: 'Vidyarthi Bhavan, Gandhi Bazaar', phone: '+91 80 2667 7588' },
      { dish: 'Bisi bele bath', place: 'CTR / Shri Sagar, Malleshwaram' },
    ],
    hotels: [
      { name: 'The Oberoi Bengaluru', phone: '+91 80 2558 5858', website: 'https://www.oberoihotels.com/hotels-in-bengaluru', area: 'MG Road' },
      { name: 'Taj West End', phone: '+91 80 6660 5660', website: 'https://www.tajhotels.com/en-in/hotels/taj-west-end-bengaluru', area: 'Race Course Road' },
      { name: 'ITC Gardenia', phone: '+91 80 2211 9898', website: 'https://www.itchotels.com/in/en/itcgardenia-bengaluru', area: 'Residency Road' },
    ],
  },
  hyderabad: {
    foods: [
      { dish: 'Hyderabadi dum biryani', place: 'Paradise Biryani, Secunderabad', website: 'https://www.paradisefoodcourt.in' },
      { dish: 'Irani chai + osmania biscuit', place: 'Nimrah Cafe, Charminar' },
    ],
    hotels: [
      { name: 'Taj Falaknuma Palace', phone: '+91 40 6629 8585', website: 'https://www.tajhotels.com/en-in/hotels/taj-falaknuma-palace-hyderabad', area: 'Falaknuma' },
      { name: 'ITC Kakatiya', phone: '+91 40 4008 1818', website: 'https://www.itchotels.com/in/en/itckakatiya-hyderabad', area: 'Begumpet' },
    ],
  },
  chennai: {
    foods: [
      { dish: 'Idli, sambar, filter coffee', place: 'Murugan Idli Shop' },
      { dish: 'Chettinad pepper chicken', place: 'Anjappar (city branches)' },
    ],
    hotels: [
      { name: 'ITC Grand Chola', phone: '+91 44 2220 0000', website: 'https://www.itchotels.com/in/en/itcgrandchola-chennai', area: 'Guindy' },
      { name: 'The Leela Palace Chennai', phone: '+91 44 3366 1234', website: 'https://www.theleela.com/the-leela-palace-chennai', area: 'Adyar' },
    ],
  },
  kolkata: {
    foods: [
      { dish: 'Kathi roll', place: 'Nizam’s, New Market' },
      { dish: 'Bengali thali + mishti', place: '6 Ballygunge Place', website: 'https://www.6ballygungeplace.in' },
    ],
    hotels: [
      { name: 'The Oberoi Grand Kolkata', phone: '+91 33 2249 2323', website: 'https://www.oberoihotels.com/hotels-in-kolkata', area: 'Chowringhee' },
      { name: 'Taj Bengal', phone: '+91 33 6612 3939', website: 'https://www.tajhotels.com/en-in/hotels/taj-bengal-kolkata', area: 'Alipore' },
    ],
  },
  jaipur: {
    foods: [
      { dish: 'Dal baati churma', place: 'LMB / Johari Bazaar halls' },
      { dish: 'Pyaaz kachori', place: 'Rawat Mishthan Bhandar, Station Road', phone: '+91 141 236 5014' },
    ],
    hotels: [
      { name: 'Rambagh Palace', phone: '+91 141 238 5700', website: 'https://www.tajhotels.com/en-in/hotels/rambagh-palace-jaipur', area: 'Bhawani Singh Road' },
      { name: 'ITC Rajputana', phone: '+91 141 510 0100', website: 'https://www.itchotels.com/in/en/itcrajputana-jaipur', area: 'Palace Road' },
    ],
  },
  agra: {
    foods: [
      { dish: 'Mughlai thali', place: 'Pinch of Spice, Fatehabad Road', website: 'https://www.pinchofspice.in' },
      { dish: 'Agra petha', place: 'Panchhi Petha, Sadar' },
    ],
    hotels: [
      { name: 'The Oberoi Amarvilas', phone: '+91 562 223 1515', website: 'https://www.oberoihotels.com/hotels-in-agra-amarvilas', area: 'Taj East Gate Road' },
      { name: 'ITC Mughal Agra', phone: '+91 562 402 1700', website: 'https://www.itchotels.com/in/en/itcmughal-agra', area: 'Taj Ganj' },
    ],
  },
  varanasi: {
    foods: [
      { dish: 'Kachori sabzi', place: 'Ram Bhandar, Thatheri Bazaar' },
      { dish: 'Banarasi lassi', place: 'Blue Lassi, near Vishwanath Gali' },
    ],
    hotels: [
      { name: 'BrijRama Palace', phone: '+91 542 239 3000', website: 'https://www.brijrama.com', area: 'Munshi Ghat' },
      { name: 'Taj Ganges Varanasi', phone: '+91 542 239 3001', website: 'https://www.tajhotels.com/en-in/hotels/taj-ganges-varanasi', area: 'Nadesar' },
    ],
  },
  goa: {
    foods: [
      { dish: 'Fish curry rice', place: 'Mum’s Kitchen, Panaji', website: 'https://www.mumskitchengoa.com' },
      { dish: 'Prawn xacuti', place: 'Viva Panjim, Fontainhas' },
    ],
    hotels: [
      { name: 'Taj Fort Aguada Resort', phone: '+91 832 664 5858', website: 'https://www.tajhotels.com/en-in/hotels/taj-fort-aguada-resort-spa-goa', area: 'Candolim' },
      { name: 'The Leela Goa', phone: '+91 832 662 1234', website: 'https://www.theleela.com/the-leela-goa', area: 'Mobor' },
    ],
  },
  udaipur: {
    foods: [
      { dish: 'Dal baati', place: 'Natraj Dining Hall, City Station Road' },
      { dish: 'Lakeside thali', place: 'Ambrai / Amet Ghat' },
    ],
    hotels: [
      { name: 'Taj Lake Palace', phone: '+91 294 242 8800', website: 'https://www.tajhotels.com/en-in/hotels/taj-lake-palace-udaipur', area: 'Lake Pichola' },
      { name: 'The Oberoi Udaivilas', phone: '+91 294 243 3300', website: 'https://www.oberoihotels.com/hotels-in-udaipur-udaivilas', area: 'Haridasji Ki Magri' },
    ],
  },
  kochi: {
    foods: [
      { dish: 'Kerala meals', place: 'Grand Hotel, MG Road' },
      { dish: 'Appam + stew', place: 'Kashi Art Cafe, Fort Kochi' },
    ],
    hotels: [
      { name: 'Brunton Boatyard', phone: '+91 484 221 5461', website: 'https://cghearth.com/brunton-boatyard', area: 'Fort Kochi' },
      { name: 'Taj Malabar Resort & Spa', phone: '+91 484 664 3000', website: 'https://www.tajhotels.com/en-in/hotels/taj-malabar-resort-spa-kochi', area: 'Willingdon Island' },
    ],
  },
  vizag: {
    foods: [
      { dish: 'Andhra meals', place: 'Beach Road halls' },
      { dish: 'Chapala pulusu', place: 'Coastal rooms, MVP / Beach Road' },
    ],
    hotels: [
      { name: 'Novotel Visakhapatnam Varun Beach', phone: '+91 891 282 2222', website: 'https://all.accor.com/hotel/7946/index.en.shtml', area: 'Beach Road' },
      { name: 'The Park Visakhapatnam', phone: '+91 891 304 5678', website: 'https://www.theparkhotels.com/visakhapatnam', area: 'Beach Road' },
    ],
  },
}

const FALLBACK = {
  foods: [{ dish: 'A busy local thali', place: 'A hall with a queue — ask for medium spice' }],
  hotels: [{ name: 'A hotel near the historic core or main boulevard', phone: 'Book on the official brand site', website: '', area: 'City centre' }],
}

export function cityPicks(id) {
  return CITY_PICKS[id] || FALLBACK
}

export function foodAnswer(id, arrival) {
  const foods = cityPicks(id).foods
  const lines = foods.map((f) => `${f.dish} at ${f.place}${f.phone ? ` (${f.phone})` : ''}`).join('. ')
  return `Famous first meals in ${arrival.name}: ${lines}. Sit where others are eating. Sealed water on day one. ${arrival.firstMeal}`
}

export function hotelAnswer(id, arrival) {
  const hotels = cityPicks(id).hotels
  const lines = hotels
    .map((h) => `${h.name} (${h.area || arrival.stayArea}) — ${h.phone || 'see website'}${h.website ? ` · ${h.website}` : ''}`)
    .join('. ')
  return `Named stays in ${arrival.name} (confirm on the official site before you call): ${lines}. Night-one area: ${arrival.stayArea}.`
}

export function planAnswer(id, arrival, weather) {
  const picks = cityPicks(id)
  const food = picks.foods[0]
  const hotel = picks.hotels[0]
  const w = weather?.summary ? ` Weather now: ${weather.tempC}°C, ${weather.summary}.` : ''
  return [
    `City: ${arrival.name}, ${arrival.state}. Airport: ${arrival.airport}.`,
    `Day 1: ${arrival.fromAirport} Check in near ${arrival.stayArea}. Eat ${food.dish} at ${food.place}. One walk: ${arrival.firstWalk}`,
    `Day 2: Main sights in the morning, indoor pause at midday, golden-hour walk.`,
    `Day 3: Neighbourhood food + one extra landmark. Keep an afternoon buffer.`,
    `Stay: ${hotel.name} — ${hotel.phone || ''} ${hotel.website || ''}`,
    `Do not: ${arrival.dont} Emergency 112.${w}`,
  ].join(' ')
}
