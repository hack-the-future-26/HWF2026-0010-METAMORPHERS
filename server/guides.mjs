/** First-visit survival notes for someone who just landed and does not know the city. */

export const CITIES = {
  delhi: { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209, lang: 'Hindi', langCode: 'hi' },
  mumbai: { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777, lang: 'Marathi / Hindi', langCode: 'hi' },
  bengaluru: { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, lang: 'Kannada', langCode: 'kn' },
  hyderabad: { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867, lang: 'Telugu / Urdu', langCode: 'te' },
  chennai: { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, lang: 'Tamil', langCode: 'ta' },
  kolkata: { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, lang: 'Bengali', langCode: 'bn' },
  jaipur: { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, lang: 'Hindi', langCode: 'hi' },
  agra: { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081, lang: 'Hindi', langCode: 'hi' },
  varanasi: { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, lang: 'Hindi', langCode: 'hi' },
  goa: { name: 'Goa', state: 'Goa', lat: 15.4909, lng: 73.8278, lang: 'Konkani / English', langCode: 'hi' },
  udaipur: { name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125, lang: 'Hindi', langCode: 'hi' },
  kochi: { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, lang: 'Malayalam', langCode: 'ml' },
  munnar: { name: 'Munnar', state: 'Kerala', lat: 10.0889, lng: 77.0595, lang: 'Malayalam', langCode: 'ml' },
  pondy: { name: 'Puducherry', state: 'Puducherry', lat: 11.9416, lng: 79.8083, lang: 'Tamil / French', langCode: 'ta' },
  vizag: { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.7041, lng: 83.2977, lang: 'Telugu', langCode: 'te' },
  amritsar: { name: 'Amritsar', state: 'Punjab', lat: 31.634, lng: 74.8723, lang: 'Punjabi', langCode: 'pa' },
  rishikesh: { name: 'Rishikesh', state: 'Uttarakhand', lat: 30.0869, lng: 78.2676, lang: 'Hindi', langCode: 'hi' },
  manali: { name: 'Manali', state: 'Himachal Pradesh', lat: 32.2396, lng: 77.1887, lang: 'Hindi', langCode: 'hi' },
  shimla: { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734, lang: 'Hindi', langCode: 'hi' },
  mysuru: { name: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394, lang: 'Kannada', langCode: 'kn' },
  jaisalmer: { name: 'Jaisalmer', state: 'Rajasthan', lat: 26.9157, lng: 70.9083, lang: 'Hindi', langCode: 'hi' },
  hampi: { name: 'Hampi', state: 'Karnataka', lat: 15.335, lng: 76.46, lang: 'Kannada', langCode: 'kn' },
  pune: { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, lang: 'Marathi', langCode: 'mr' },
  darjeeling: { name: 'Darjeeling', state: 'West Bengal', lat: 27.036, lng: 88.2627, lang: 'Nepali / Bengali', langCode: 'bn' },
  leh: { name: 'Leh', state: 'Ladakh', lat: 34.1526, lng: 77.5771, lang: 'Ladakhi / Hindi', langCode: 'hi' },
}

const DETAIL = {
  delhi: {
    airport: 'Indira Gandhi International (DEL)',
    fromAirport: 'Take the Airport Express metro to New Delhi (~45–60 min) or a prepaid taxi / Uber. Ignore touts at the curb.',
    firstWalk: 'India Gate lawns at sunset — open, lit, easy to orient yourself.',
    firstMeal: 'Chole bhature or a simple thali around Connaught Place.',
    sim: 'Jio or Airtel kiosk in T3 arrivals. Passport + one photo.',
    money: 'UPI works almost everywhere. Keep ₹500–1000 cash for autos.',
    dont: 'Do not hop into an unmarked airport taxi. Use prepaid or an app.',
    stayArea: 'Connaught Place or Aerocity if you land late.',
  },
  mumbai: {
    airport: 'Chhatrapati Shivaji Maharaj International (BOM)',
    fromAirport: 'Prepaid taxi or Uber to South Mumbai is 60–90 min. Local trains later, not on day one with luggage.',
    firstWalk: 'Marine Drive at dusk — the Queen’s Necklace is the easiest first view.',
    firstMeal: 'Vada pav and cutting chai, then a sit-down thali in Fort / Colaba.',
    sim: 'Counters at arrivals. Aadhaar helps residents; tourists need passport.',
    money: 'UPI + a little cash. Taxi meters or apps only.',
    dont: 'Avoid peak local-train crush with bags. Use taxi the first day.',
    stayArea: 'Colaba or Bandra depending on flights vs nightlife.',
  },
  bengaluru: {
    airport: 'Kempegowda International (BLR)',
    fromAirport: 'KIAL bus, airport taxi or Vande Bharat / metro link — 60–90 min to the city.',
    firstWalk: 'Cubbon Park or MG Road boulevard to feel the city scale.',
    firstMeal: 'Filter coffee + dosa. Try a clean darshini.',
    sim: 'Airport kiosks. English is widely spoken in the core.',
    money: 'UPI is default. Autos: insist on meter or Namma Yatri / Uber.',
    dont: 'Do not trust “fixed fare” street autos from the airport.',
    stayArea: 'MG Road / Indiranagar for first-timers.',
  },
  hyderabad: {
    airport: 'Rajiv Gandhi International (HYD)',
    fromAirport: 'Airport bus or cab to the city (~45–70 min).',
    firstWalk: 'Hussain Sagar necklace road in the evening.',
    firstMeal: 'Hyderabadi veg or chicken biryani — pick a busy hall.',
    sim: 'Airport counters. Telugu and Hindi both work.',
    money: 'UPI + cash for old-city lanes.',
    dont: 'Charminar lanes are crowded — keep bags zipped.',
    stayArea: 'Banjara Hills or near Hussain Sagar.',
  },
  chennai: {
    airport: 'Chennai International (MAA)',
    fromAirport: 'Prepaid taxi or metro (where connected). 40–70 min to the centre.',
    firstWalk: 'Marina Beach promenade — go early morning or late evening.',
    firstMeal: 'Idli, sambar, filter coffee. Ask for “less spice” if needed.',
    sim: 'Airport. Tamil is the local language; English in hotels.',
    money: 'UPI everywhere. Autos: meter or app.',
    dont: 'Midday Marina sun is harsh. Carry water.',
    stayArea: 'Nungambakkam or Besant Nagar.',
  },
  kolkata: {
    airport: 'Netaji Subhas Chandra Bose (CCU)',
    fromAirport: 'Prepaid taxi or app to Park Street / Esplanade (~60 min).',
    firstWalk: 'Victoria Memorial gardens, then a tram glimpse on the way back.',
    firstMeal: 'Kathi roll + mishti. Sit-down Bengali thali if you have time.',
    sim: 'Airport. Bengali and Hindi both heard.',
    money: 'UPI + small cash for trams and stalls.',
    dont: 'Keep phones tight on Howrah Bridge walkways.',
    stayArea: 'Park Street or Sudder Street for walkability.',
  },
  jaipur: {
    airport: 'Jaipur International (JAI)',
    fromAirport: 'Airport taxi to the old city (~40 min).',
    firstWalk: 'Hawa Mahal facade from the street, then Badi Choupad.',
    firstMeal: 'Dal baati churma or a simple Rajasthani thali.',
    sim: 'Airport. Hindi is enough.',
    money: 'Bargain politely in bazaars. UPI in shops.',
    dont: 'Confirm auto fare before you sit. Midday forts are hot.',
    stayArea: 'Bani Park or inside the walled city if you like noise.',
  },
  agra: {
    airport: 'Agra / nearest is often Delhi + Gatimaan or cab.',
    fromAirport: 'If you arrive by train, prepaid auto to Taj Ganj. From Delhi, 3–4 hours by express.',
    firstWalk: 'Mehtab Bagh at sunset if the Taj is booked for sunrise tomorrow.',
    firstMeal: 'Simple North Indian thali near Taj Ganj — eat at a busy place.',
    sim: 'Buy in Delhi if you are transiting. Agra kiosks work too.',
    money: 'UPI. Official ticket counters only for the Taj.',
    dont: 'Ignore “Taj is closed, I am a guide” touts.',
    stayArea: 'Taj Ganj for walking, or Fatehabad Road hotels.',
  },
  varanasi: {
    airport: 'Lal Bahadur Shastri (VNS)',
    fromAirport: 'Cab to Assi or Godowlia (~45–70 min). Last mile to ghats is walking / cycle-rickshaw.',
    firstWalk: 'Assi Ghat at sunrise, not the busiest ghat on hour one.',
    firstMeal: 'Kachori sabzi and lassi. Bottled water only at first.',
    sim: 'Airport or Cantonment. Hindi is essential; English in hotels.',
    money: 'Cash + UPI. Alleys are tight — slim wallet.',
    dont: 'Do not book random boat touts at the first handshake. Agree a price.',
    stayArea: 'Assi Ghat side is calmer for first-timers.',
  },
  goa: {
    airport: 'Dabolim (GOX) or Mopa (GOX/GOI depending on flight).',
    fromAirport: 'Pre-paid taxi. North Goa (Baga/Calangute) vs Panaji / South — decide before you exit.',
    firstWalk: 'Panaji fountain square or a quiet beach at your base, not the loudest shack first night.',
    firstMeal: 'Fish curry rice if you eat fish; else xacuti veg + feni-free lime soda.',
    sim: 'Airport. English is easy.',
    money: 'UPI in shacks. Rentals: photograph the scooter first.',
    dont: 'Do not ride a scooter without a licence and helmet. Night potholes.',
    stayArea: 'Fontainhas / Panaji for culture, Calangute belt for beach week.',
  },
  udaipur: {
    airport: 'Maharana Pratap (UDR)',
    fromAirport: 'Taxi to the old city (~45 min).',
    firstWalk: 'Gangaur Ghat on Lake Pichola at blue hour.',
    firstMeal: 'Dal baati or lakeside thali — pick a place with locals, not only a view.',
    sim: 'Airport. Hindi.',
    money: 'UPI. Boat tickets from official ghat counters.',
    dont: 'Steep lanes + rolling bags = pain. Pack a day bag.',
    stayArea: 'Old city for views, Fateh Sagar side for quieter nights.',
  },
  kochi: {
    airport: 'Cochin International (COK)',
    fromAirport: 'Airport metro / cab to Ernakulam or Fort Kochi (~60–90 min).',
    firstWalk: 'Chinese fishing nets at golden hour, then Jew Town.',
    firstMeal: 'Kerala meals — rice, sambar, thoran, pickle. Ask for medium spice.',
    sim: 'Airport. Malayalam; English in Fort Kochi.',
    money: 'UPI. Ferries are cheap — keep coins / UPI ready.',
    dont: 'Fort Kochi is walkable; do not overpay a round-the-island taxi on day one.',
    stayArea: 'Fort Kochi for first-timers.',
  },
  munnar: {
    airport: 'Cochin (COK) then 4 hours by cab into the hills.',
    fromAirport: 'Pre-book a cab. Hairpin roads — leave before 2 pm if you get motion sick.',
    firstWalk: 'A short tea-garden walk near town, not a long trek on arrival day.',
    firstMeal: 'Hot Kerala meals and tea. Evenings get cold.',
    sim: 'Buy in Kochi. Hill signal is patchy.',
    money: 'UPI in town. Cash for viewpoints.',
    dont: 'Do not drive yourself on day one in fog.',
    stayArea: 'Near Munnar town for ATMs and food.',
  },
  pondy: {
    airport: 'Puducherry (PNY) or Chennai + 3 hour cab.',
    fromAirport: 'Taxi to White Town. Scooters the next morning.',
    firstWalk: 'Goubert Avenue promenade at sunrise or after 5 pm.',
    firstMeal: 'Cafes in White Town; try a Tamil meal one lane inland.',
    sim: 'Chennai or local store. Tamil + English.',
    money: 'UPI. Cycle rentals are common.',
    dont: 'Promenade sun is sharp at noon.',
    stayArea: 'White Town for walking; Auroville needs a day trip.',
  },
  vizag: {
    airport: 'Visakhapatnam (VTZ)',
    fromAirport: 'Airport taxi to Beach Road / Siripuram (~30–45 min).',
    firstWalk: 'RK Beach road — submarine museum and coastline in one stroll.',
    firstMeal: 'Andhra meals. Ask for “less spicy” — it is still spicy.',
    sim: 'Airport. Telugu; English in hotels.',
    money: 'UPI. App taxis work on Beach Road.',
    dont: 'Rushikonda currents can be strong. Swim only where locals do.',
    stayArea: 'Beach Road or Siripuram for first night.',
  },
  amritsar: {
    airport: 'Sri Guru Ram Dass Jee (ATQ)',
    fromAirport: 'Cab to the Golden Temple area (~30–40 min).',
    firstWalk: 'Harmandir Sahib parikrama at dusk. Cover head, no shoes.',
    firstMeal: 'Langar inside the temple — sit on the floor, accept what is served.',
    sim: 'Airport. Punjabi and Hindi.',
    money: 'UPI. Wagah needs an afternoon buffer.',
    dont: 'Do not rush Wagah and the temple on the same exhausted evening if you land late.',
    stayArea: 'Near Golden Temple for walking.',
  },
  rishikesh: {
    airport: 'Dehradun (DED) + 1.5 hour cab, or Haridwar train.',
    fromAirport: 'Cab to Tapovan / Laxman Jhula side.',
    firstWalk: 'Ram Jhula to Laxman Jhula at sunset. Leave river sports for day 2.',
    firstMeal: 'Cafe on the east bank. Many are vegetarian only.',
    sim: 'Haridwar or Rishikesh market.',
    money: 'UPI. ATMs can queue on weekends.',
    dont: 'Ganga currents — no swimming. Helmet if you scooter.',
    stayArea: 'Tapovan for cafes, or quieter upstream stays.',
  },
  manali: {
    airport: 'Bhuntar (KUU) or overnight bus from Delhi.',
    fromAirport: 'Cab up the Beas valley. Arrival day is for rest — altitude and curves.',
    firstWalk: 'Mall Road and the river path. Solang can wait.',
    firstMeal: 'Hot thali. Carry a layer even in May evenings.',
    sim: 'Buy in lower town. Rohtang needs permits later.',
    money: 'UPI in town. Cash for villages.',
    dont: 'Do not book snow “packages” at the bus stand on night one.',
    stayArea: 'Old Manali if you want quiet cafes.',
  },
  shimla: {
    airport: 'Jubbarhatti (SLV) or Kalka toy train / Chandigarh cab.',
    fromAirport: 'Cab to The Ridge. Steep walks — pack light for day one.',
    firstWalk: 'The Ridge to Scandal Point to Mall Road.',
    firstMeal: 'Cafe on the Mall. Evenings are cool.',
    sim: 'Town market.',
    money: 'UPI. Pedestrians only on the Mall — taxis stop below.',
    dont: 'Do not drag large suitcases up Jakhu on arrival.',
    stayArea: 'Near The Ridge / Mall for first night.',
  },
  mysuru: {
    airport: 'Mysore (MYQ) or Bengaluru + 3 hour cab/train.',
    fromAirport: 'Cab to the palace quarter.',
    firstWalk: 'Mysore Palace exterior at dusk; lit nights are the show.',
    firstMeal: 'Mysore masala dosa and filter coffee.',
    sim: 'City. Kannada + English.',
    money: 'UPI.',
    dont: 'Palace interiors have ticket slots — check the day before.',
    stayArea: 'Near Sayyaji Rao Road.',
  },
  jaisalmer: {
    airport: 'Jaisalmer (JSA) or Jodhpur + 5 hour road.',
    fromAirport: 'Cab to the fort / Gadisar side. Desert heat — hydrate.',
    firstWalk: 'Fort ramparts at late afternoon, not 1 pm.',
    firstMeal: 'Rajasthani thali. Evenings on the fort are cooler.',
    sim: 'Town. Hindi.',
    money: 'UPI in town. Dune camps often prefer cash.',
    dont: 'Book a dune camp after you see the room photos, not from the station tout.',
    stayArea: 'Inside or just below the fort.',
  },
  hampi: {
    airport: 'Hubballi (HBX) or Ballari + 1–3 hour cab. Overnight train to Hosapete.',
    fromAirport: 'Cab to Hampi Bazaar or Virupapur Gaddi (across the river).',
    firstWalk: 'Virupaksha courtyard, then sit — ruins are huge. Rent a bicycle day 2.',
    firstMeal: 'Simple meals near the bazaar. Carry water and a hat.',
    sim: 'Hosapete has better stores than the village.',
    money: 'UPI patchy. Cash for coracles and tickets.',
    dont: 'Midday stone reflects heat. Start at 6:30 am.',
    stayArea: 'Hampi Bazaar for temples, Virupapur for quieter nights.',
  },
  pune: {
    airport: 'Pune (PNQ)',
    fromAirport: 'Cab to Koregaon Park or FC Road (~40–70 min).',
    firstWalk: 'FC Road / JM Road in the evening, or Shaniwar Wada next morning.',
    firstMeal: 'Misal if you handle spice; else a Maharashtrian thali.',
    sim: 'Airport. Marathi + English.',
    money: 'UPI. App cabs are easy.',
    dont: 'Do not try Sinhagad as a late-night arrival hike.',
    stayArea: 'Koregaon Park or Shivajinagar.',
  },
  darjeeling: {
    airport: 'Bagdogra (IXB) + 3–4 hour mountain road to Darjeeling.',
    fromAirport: 'Shared jeep or reserved cab. Arrive before dark if you can.',
    firstWalk: 'Mall Road. Tiger Hill is a 3:30 am start — not tonight.',
    firstMeal: 'Thukpa or tea-estate cafe. Nights are cold.',
    sim: 'Buy in Siliguri if you change vehicles.',
    money: 'UPI on the Mall. Cash for taxis.',
    dont: 'Do not walk unlit hillside shortcuts at night.',
    stayArea: 'Around the Mall / Chowrasta.',
  },
  leh: {
    airport: 'Kushok Bakula Rimpochee (IXL)',
    fromAirport: 'Short cab to Leh town. Day 1–2: rest. No Pangong, no pass.',
    firstWalk: 'Leh market only. Drink water. Skip alcohol on arrival.',
    firstMeal: 'Light food. Thukpa or simple rice. AMS is real.',
    sim: 'Postpaid tourist SIMs in the bazaar — prepaid often fails up here.',
    money: 'ATMs can be dry. Carry cash from Delhi.',
    dont: 'Do not fly in and drive to Khardung La the same day.',
    stayArea: 'Changspa / Main Bazaar for walking.',
  },
}

const PHRASEBOOK = {
  hi: [
    { en: 'How much is this?', local: 'Yeh kitne ka hai?' },
    { en: 'Please take me here.', local: 'Mujhe yahan le chaliye.' },
    { en: 'Where is the hotel?', local: 'Hotel kahan hai?' },
    { en: 'I need water.', local: 'Mujhe paani chahiye.' },
    { en: 'Thank you.', local: 'Dhanyavaad. / Shukriya.' },
  ],
  te: [
    { en: 'How much is this?', local: 'Idi enta?' },
    { en: 'Please take me here.', local: 'Nannu ikkadiki teesukellandi.' },
    { en: 'Where is the hotel?', local: 'Hotel ekkada undi?' },
    { en: 'I need water.', local: 'Naaku neellu kavali.' },
    { en: 'Thank you.', local: 'Dhanyavadalu.' },
  ],
  ta: [
    { en: 'How much is this?', local: 'Idhu evvalavu?' },
    { en: 'Please take me here.', local: 'Ennai inge kondu sellungal.' },
    { en: 'Where is the hotel?', local: 'Hotel enge irukku?' },
    { en: 'I need water.', local: 'Enakku thanni venum.' },
    { en: 'Thank you.', local: 'Nandri.' },
  ],
  kn: [
    { en: 'How much is this?', local: 'Idu eshtu?' },
    { en: 'Please take me here.', local: 'Nannannu illige karedi.' },
    { en: 'Where is the hotel?', local: 'Hotel elli ide?' },
    { en: 'I need water.', local: 'Nanage neeru beku.' },
    { en: 'Thank you.', local: 'Dhanyavadagalu.' },
  ],
  ml: [
    { en: 'How much is this?', local: 'Ith entha vilaya?' },
    { en: 'Please take me here.', local: 'Enne iviide kondu pokoo.' },
    { en: 'Where is the hotel?', local: 'Hotel evideya?' },
    { en: 'I need water.', local: 'Enikku vellam venam.' },
    { en: 'Thank you.', local: 'Nanni.' },
  ],
  bn: [
    { en: 'How much is this?', local: 'Eta koto?' },
    { en: 'Please take me here.', local: 'Amake ekhane niye jan.' },
    { en: 'Where is the hotel?', local: 'Hotel kothay?' },
    { en: 'I need water.', local: 'Amar jol chai.' },
    { en: 'Thank you.', local: 'Dhonnobad.' },
  ],
  mr: [
    { en: 'How much is this?', local: 'He kiti?' },
    { en: 'Please take me here.', local: 'Mala ithe nya.' },
    { en: 'Where is the hotel?', local: 'Hotel kuthe aahe?' },
    { en: 'I need water.', local: 'Mala pani pahije.' },
    { en: 'Thank you.', local: 'Dhanyavad.' },
  ],
  pa: [
    { en: 'How much is this?', local: 'Eh kine da hai?' },
    { en: 'Please take me here.', local: 'Mainu ethe le chalo.' },
    { en: 'Where is the hotel?', local: 'Hotel kithe hai?' },
    { en: 'I need water.', local: 'Mainu pani chahida.' },
    { en: 'Thank you.', local: 'Meharbaani.' },
  ],
}

export function buildArrival(id) {
  const city = CITIES[id] || { name: 'This city', state: 'India', lat: 20.59, lng: 78.96, lang: 'Hindi', langCode: 'hi' }
  const d = DETAIL[id] || {
    airport: 'Nearest airport or railway station',
    fromAirport: 'Use a prepaid taxi or app cab. Agree the fare before you start if there is no meter.',
    firstWalk: 'Start with the main public square or waterfront — open, lit, easy to leave.',
    firstMeal: 'Eat at a busy local place. Ask for medium spice.',
    sim: 'Buy a tourist SIM at the airport with your passport.',
    money: 'UPI plus a little cash.',
    dont: 'Do not follow strangers offering “special” tickets.',
    stayArea: 'Stay near the historic core or the main boulevard on night one.',
  }
  const phrases = PHRASEBOOK[city.langCode] || PHRASEBOOK.hi
  return {
    id,
    ...city,
    ...d,
    emergency: '112',
    ambulance: '108',
    police: '100',
    hours: [
      { id: 'land', t: 'Hour 0–2', title: 'Land & connect', detail: `${d.airport}. ${d.sim}` },
      { id: 'move', t: 'Hour 2–4', title: 'Reach a bed', detail: `${d.fromAirport} Sleep before you sightsee if you flew overnight.` },
      { id: 'eat', t: 'First meal', title: 'Eat something familiar-spicy', detail: d.firstMeal },
      { id: 'walk', t: 'Golden hour', title: 'One easy walk', detail: d.firstWalk },
      { id: 'night', t: 'Night', title: 'Charge, cash, tomorrow', detail: `Stay around ${d.stayArea}. Pin your hotel. Emergency is 112.` },
    ],
    kit: [
      { id: 'sim', icon: '📡', title: 'Phone & SIM', body: d.sim },
      { id: 'cash', icon: '₹', title: 'Money', body: d.money },
      { id: 'ride', icon: '🚕', title: 'First ride', body: d.fromAirport },
      { id: 'talk', icon: '🗣️', title: 'Language', body: `${city.lang} is what you will hear. English works in hotels; these five phrases cover the street.` },
      { id: 'safe', icon: '🛡️', title: 'Do not', body: d.dont },
      { id: 'sos', icon: '🆘', title: 'Emergency', body: 'National emergency 112 · Ambulance 108 · Police 100. Share live location with one person at home.' },
    ],
    phrases: phrases.map((p) => ({ ...p, lang: city.langCode })),
    actions: [
      { id: 'lost', label: 'I am lost', prompt: `I just arrived in ${city.name} and I am lost. What should I do in the next 15 minutes?` },
      { id: 'hungry', label: 'I am hungry', prompt: `I just arrived in ${city.name} and I am hungry. What should a first-timer eat and where, simply?` },
      { id: 'sim', label: 'I need a SIM', prompt: `How do I get a working phone SIM as a new arrival in ${city.name}?` },
      { id: 'ride', label: 'Airport to hotel', prompt: `How do I go from the airport to a first-night hotel in ${city.name} safely?` },
    ],
  }
}

export function answerAsLocal(prompt, arrival, weather) {
  const q = (prompt || '').toLowerCase()
  const w = weather?.summary ? ` Weather now: ${weather.tempC}°C, ${weather.summary}.` : ''
  if (/lost|where am i|orient/.test(q)) {
    const landmark = String(arrival.firstWalk.split('—')[0] || arrival.name).replace(/[.]+$/, '')
    return `Stop walking. Drop a pin on your map and share it with one person. Walk toward a lit main road, hotel, or ${landmark}. Do not follow a stranger “shortcut”. Emergency is 112.${w}`
  }
  if (/hungry|eat|food|breakfast|lunch|dinner/.test(q)) {
    return `${arrival.firstMeal} Sit where others are eating. Drink sealed water on day one.${w}`
  }
  if (/sim|phone|network|internet/.test(q)) {
    return arrival.sim
  }
  if (/taxi|airport|cab|uber|ola|train|metro/.test(q)) {
    return arrival.fromAirport
  }
  if (/hotel|stay|sleep/.test(q)) {
    return `For night one stay near ${arrival.stayArea}. Confirm the pin before you pay the driver.`
  }
  if (/safe|danger|scam|tout/.test(q)) {
    return `${arrival.dont} If you feel unsafe, enter a hotel lobby or pharmacy and call 112.`
  }
  if (/rain|weather|hot|cold/.test(q)) {
    return w.trim() || `Check the live weather card. In ${arrival.name}, plan the heavy walking for morning or evening.`
  }
  return `You are new in ${arrival.name}, ${arrival.state}. First ride: ${arrival.fromAirport} First walk: ${arrival.firstWalk} ${w} Ask me “I am lost”, “I am hungry”, or “I need a SIM” if you want a shorter answer.`
}
