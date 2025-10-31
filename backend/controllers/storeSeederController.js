import Store from '../models/Store.js';

// Helper to build a GeoJSON point safely
const point = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });

// Continental US bounds used for validation
const MIN_LAT = 24.0;
const MAX_LAT = 49.0;
const MIN_LNG = -125.0;
const MAX_LNG = -66.0;

// Curated store data across the US — all within bounds and named per state/city
const sampleStores = [
  { storeID: 'ST001', storeName: 'MCCS New York Store', storeLocation: '123 Broadway, New York, NY', zipCode: '10001', coordinates: point(40.7128, -74.0060), status: 'active', contactInfo: { phone: '+1-555-0101', email: 'nyc@mccs.com' } },
  { storeID: 'ST002', storeName: 'MCCS Los Angeles Store', storeLocation: '456 Hollywood Blvd, Los Angeles, CA', zipCode: '90028', coordinates: point(34.0522, -118.2437), status: 'active', contactInfo: { phone: '+1-555-0102', email: 'la@mccs.com' } },
  { storeID: 'ST003', storeName: 'MCCS Chicago Store', storeLocation: '789 Michigan Ave, Chicago, IL', zipCode: '60601', coordinates: point(41.8781, -87.6298), status: 'active', contactInfo: { phone: '+1-555-0103', email: 'chicago@mccs.com' } },
  { storeID: 'ST004', storeName: 'MCCS Dallas Store', storeLocation: '200 Main St, Dallas, TX', zipCode: '75201', coordinates: point(32.7767, -96.7970), status: 'active', contactInfo: { phone: '+1-555-0104', email: 'dallas@mccs.com' } },
  { storeID: 'ST005', storeName: 'MCCS Houston Store', storeLocation: '987 Main Street, Houston, TX', zipCode: '77002', coordinates: point(29.7604, -95.3698), status: 'active', contactInfo: { phone: '+1-555-0105', email: 'houston@mccs.com' } },
  { storeID: 'ST006', storeName: 'MCCS Phoenix Store', storeLocation: '234 Central Ave, Phoenix, AZ', zipCode: '85004', coordinates: point(33.4484, -112.0740), status: 'active', contactInfo: { phone: '+1-555-0106', email: 'phoenix@mccs.com' } },
  { storeID: 'ST007', storeName: 'MCCS San Diego Store', storeLocation: '100 Harbor Dr, San Diego, CA', zipCode: '92101', coordinates: point(32.7157, -117.1611), status: 'active', contactInfo: { phone: '+1-555-0107', email: 'sandiego@mccs.com' } },
  { storeID: 'ST008', storeName: 'MCCS San Jose Store', storeLocation: '1 Market St, San Jose, CA', zipCode: '95113', coordinates: point(37.3382, -121.8863), status: 'active', contactInfo: { phone: '+1-555-0108', email: 'sanjose@mccs.com' } },
  { storeID: 'ST009', storeName: 'MCCS Austin Store', storeLocation: '500 Congress Ave, Austin, TX', zipCode: '78701', coordinates: point(30.2672, -97.7431), status: 'active', contactInfo: { phone: '+1-555-0109', email: 'austin@mccs.com' } },
  { storeID: 'ST010', storeName: 'MCCS Jacksonville Store', storeLocation: '700 Riverplace Blvd, Jacksonville, FL', zipCode: '32207', coordinates: point(30.3322, -81.6557), status: 'active', contactInfo: { phone: '+1-555-0110', email: 'jacksonville@mccs.com' } },
  { storeID: 'ST011', storeName: 'MCCS Atlanta Store', storeLocation: '456 Peachtree St, Atlanta, GA', zipCode: '30309', coordinates: point(33.7490, -84.3880), status: 'active', contactInfo: { phone: '+1-555-0111', email: 'atlanta@mccs.com' } },
  { storeID: 'ST012', storeName: 'MCCS Miami Store', storeLocation: '321 Ocean Drive, Miami, FL', zipCode: '33139', coordinates: point(25.7617, -80.1918), status: 'active', contactInfo: { phone: '+1-555-0112', email: 'miami@mccs.com' } },
  { storeID: 'ST013', storeName: 'MCCS Denver Store', storeLocation: '789 16th Street, Denver, CO', zipCode: '80202', coordinates: point(39.7392, -104.9903), status: 'active', contactInfo: { phone: '+1-555-0113', email: 'denver@mccs.com' } },
  { storeID: 'ST014', storeName: 'MCCS Seattle Store', storeLocation: '654 Pike Street, Seattle, WA', zipCode: '98101', coordinates: point(47.6062, -122.3321), status: 'active', contactInfo: { phone: '+1-555-0114', email: 'seattle@mccs.com' } },
  { storeID: 'ST015', storeName: 'MCCS Portland Store', storeLocation: '123 SW Morrison St, Portland, OR', zipCode: '97205', coordinates: point(45.5152, -122.6784), status: 'active', contactInfo: { phone: '+1-555-0115', email: 'portland@mccs.com' } },
  { storeID: 'ST016', storeName: 'MCCS Las Vegas Store', storeLocation: '321 Las Vegas Blvd, Las Vegas, NV', zipCode: '89101', coordinates: point(36.1699, -115.1398), status: 'active', contactInfo: { phone: '+1-555-0116', email: 'lasvegas@mccs.com' } },
  { storeID: 'ST017', storeName: 'MCCS Charlotte Store', storeLocation: '456 Trade Street, Charlotte, NC', zipCode: '28202', coordinates: point(35.2271, -80.8431), status: 'active', contactInfo: { phone: '+1-555-0117', email: 'charlotte@mccs.com' } },
  { storeID: 'ST018', storeName: 'MCCS Detroit Store', storeLocation: '789 Woodward Ave, Detroit, MI', zipCode: '48226', coordinates: point(42.3314, -83.0458), status: 'active', contactInfo: { phone: '+1-555-0118', email: 'detroit@mccs.com' } },
  { storeID: 'ST019', storeName: 'MCCS Minneapolis Store', storeLocation: '500 Nicollet Mall, Minneapolis, MN', zipCode: '55402', coordinates: point(44.9778, -93.2650), status: 'active', contactInfo: { phone: '+1-555-0119', email: 'minneapolis@mccs.com' } },
  { storeID: 'ST020', storeName: 'MCCS St. Louis Store', storeLocation: '1 S Broadway, St. Louis, MO', zipCode: '63102', coordinates: point(38.6270, -90.1994), status: 'active', contactInfo: { phone: '+1-555-0120', email: 'stlouis@mccs.com' } },
  { storeID: 'ST021', storeName: 'MCCS Nashville Store', storeLocation: '600 Broadway, Nashville, TN', zipCode: '37203', coordinates: point(36.1627, -86.7816), status: 'active', contactInfo: { phone: '+1-555-0121', email: 'nashville@mccs.com' } },
  { storeID: 'ST022', storeName: 'MCCS Indianapolis Store', storeLocation: '200 Monument Cir, Indianapolis, IN', zipCode: '46204', coordinates: point(39.7684, -86.1581), status: 'active', contactInfo: { phone: '+1-555-0122', email: 'indianapolis@mccs.com' } },
  { storeID: 'ST023', storeName: 'MCCS Columbus Store', storeLocation: '300 High St, Columbus, OH', zipCode: '43215', coordinates: point(39.9612, -82.9988), status: 'active', contactInfo: { phone: '+1-555-0123', email: 'columbus@mccs.com' } },
  { storeID: 'ST024', storeName: 'MCCS Washington DC Store', storeLocation: '1600 Pennsylvania Ave NW, Washington, DC', zipCode: '20500', coordinates: point(38.9072, -77.0369), status: 'active', contactInfo: { phone: '+1-555-0124', email: 'dc@mccs.com' } },
  { storeID: 'ST025', storeName: 'MCCS Boston Store', storeLocation: '987 Newbury Street, Boston, MA', zipCode: '02115', coordinates: point(42.3601, -71.0589), status: 'active', contactInfo: { phone: '+1-555-0125', email: 'boston@mccs.com' } }
  ,{ storeID: 'ST026', storeName: 'MCCS San Francisco Store', storeLocation: '1 Market St, San Francisco, CA', zipCode: '94105', coordinates: point(37.7749, -122.4194), status: 'active', contactInfo: { phone: '+1-555-0126', email: 'sf@mccs.com' } }
  ,{ storeID: 'ST027', storeName: 'MCCS Sacramento Store', storeLocation: '915 I St, Sacramento, CA', zipCode: '95814', coordinates: point(38.5816, -121.4944), status: 'active', contactInfo: { phone: '+1-555-0127', email: 'sac@mccs.com' } }
  ,{ storeID: 'ST028', storeName: 'MCCS Albuquerque Store', storeLocation: '400 Central Ave SW, Albuquerque, NM', zipCode: '87102', coordinates: point(35.0844, -106.6504), status: 'active', contactInfo: { phone: '+1-555-0128', email: 'abq@mccs.com' } }
  ,{ storeID: 'ST029', storeName: 'MCCS Salt Lake City Store', storeLocation: '100 S Main St, Salt Lake City, UT', zipCode: '84101', coordinates: point(40.7608, -111.8910), status: 'active', contactInfo: { phone: '+1-555-0129', email: 'slc@mccs.com' } }
  ,{ storeID: 'ST030', storeName: 'MCCS Boise Store', storeLocation: '777 W Main St, Boise, ID', zipCode: '83702', coordinates: point(43.6150, -116.2023), status: 'active', contactInfo: { phone: '+1-555-0130', email: 'boise@mccs.com' } }
  ,{ storeID: 'ST031', storeName: 'MCCS Billings Store', storeLocation: '100 N 27th St, Billings, MT', zipCode: '59101', coordinates: point(45.7833, -108.5007), status: 'active', contactInfo: { phone: '+1-555-0131', email: 'billings@mccs.com' } }
  ,{ storeID: 'ST032', storeName: 'MCCS Cheyenne Store', storeLocation: '2101 O Neil Ave, Cheyenne, WY', zipCode: '82001', coordinates: point(41.1400, -104.8202), status: 'active', contactInfo: { phone: '+1-555-0132', email: 'cheyenne@mccs.com' } }
  ,{ storeID: 'ST033', storeName: 'MCCS Omaha Store', storeLocation: '1819 Farnam St, Omaha, NE', zipCode: '68102', coordinates: point(41.2565, -95.9345), status: 'active', contactInfo: { phone: '+1-555-0133', email: 'omaha@mccs.com' } }
  ,{ storeID: 'ST034', storeName: 'MCCS Wichita Store', storeLocation: '455 N Main St, Wichita, KS', zipCode: '67202', coordinates: point(37.6872, -97.3301), status: 'active', contactInfo: { phone: '+1-555-0134', email: 'wichita@mccs.com' } }
  ,{ storeID: 'ST035', storeName: 'MCCS Oklahoma City Store', storeLocation: '200 N Walker Ave, Oklahoma City, OK', zipCode: '73102', coordinates: point(35.4676, -97.5164), status: 'active', contactInfo: { phone: '+1-555-0135', email: 'okc@mccs.com' } }
  ,{ storeID: 'ST036', storeName: 'MCCS New Orleans Store', storeLocation: '100 Bourbon St, New Orleans, LA', zipCode: '70130', coordinates: point(29.9511, -90.0715), status: 'active', contactInfo: { phone: '+1-555-0136', email: 'neworleans@mccs.com' } }
  ,{ storeID: 'ST037', storeName: 'MCCS Birmingham Store', storeLocation: '710 20th St N, Birmingham, AL', zipCode: '35203', coordinates: point(33.5186, -86.8104), status: 'active', contactInfo: { phone: '+1-555-0137', email: 'birmingham@mccs.com' } }
  ,{ storeID: 'ST038', storeName: 'MCCS Charleston Store', storeLocation: '188 Meeting St, Charleston, SC', zipCode: '29401', coordinates: point(32.7765, -79.9311), status: 'active', contactInfo: { phone: '+1-555-0138', email: 'charleston@mccs.com' } }
  ,{ storeID: 'ST039', storeName: 'MCCS Raleigh Store', storeLocation: '222 Fayetteville St, Raleigh, NC', zipCode: '27601', coordinates: point(35.7796, -78.6382), status: 'active', contactInfo: { phone: '+1-555-0139', email: 'raleigh@mccs.com' } }
  ,{ storeID: 'ST040', storeName: 'MCCS Richmond Store', storeLocation: '900 E Broad St, Richmond, VA', zipCode: '23219', coordinates: point(37.5407, -77.4360), status: 'active', contactInfo: { phone: '+1-555-0140', email: 'richmond@mccs.com' } }
  ,{ storeID: 'ST041', storeName: 'MCCS Newark Store', storeLocation: '920 Broad St, Newark, NJ', zipCode: '07102', coordinates: point(40.7357, -74.1724), status: 'active', contactInfo: { phone: '+1-555-0141', email: 'newark@mccs.com' } }
  ,{ storeID: 'ST042', storeName: 'MCCS Providence Store', storeLocation: '1 Kennedy Plz, Providence, RI', zipCode: '02903', coordinates: point(41.8240, -71.4128), status: 'active', contactInfo: { phone: '+1-555-0142', email: 'providence@mccs.com' } }
  ,{ storeID: 'ST043', storeName: 'MCCS Pittsburgh Store', storeLocation: '600 Grant St, Pittsburgh, PA', zipCode: '15219', coordinates: point(40.4406, -79.9959), status: 'active', contactInfo: { phone: '+1-555-0143', email: 'pittsburgh@mccs.com' } }
  ,{ storeID: 'ST044', storeName: 'MCCS Cleveland Store', storeLocation: '50 Public Sq, Cleveland, OH', zipCode: '44113', coordinates: point(41.4993, -81.6944), status: 'active', contactInfo: { phone: '+1-555-0144', email: 'cleveland@mccs.com' } }
  ,{ storeID: 'ST045', storeName: 'MCCS Milwaukee Store', storeLocation: '200 E Wells St, Milwaukee, WI', zipCode: '53202', coordinates: point(43.0389, -87.9065), status: 'active', contactInfo: { phone: '+1-555-0145', email: 'milwaukee@mccs.com' } }
  ,{ storeID: 'ST046', storeName: 'MCCS Des Moines Store', storeLocation: '400 Robert D. Ray Dr, Des Moines, IA', zipCode: '50309', coordinates: point(41.5868, -93.6250), status: 'active', contactInfo: { phone: '+1-555-0146', email: 'desmoines@mccs.com' } }
  ,{ storeID: 'ST047', storeName: 'MCCS Kansas City Store', storeLocation: '12th & Oak St, Kansas City, MO', zipCode: '64106', coordinates: point(39.0997, -94.5786), status: 'active', contactInfo: { phone: '+1-555-0147', email: 'kansascity@mccs.com' } }
  ,{ storeID: 'ST048', storeName: 'MCCS Tucson Store', storeLocation: '200 S 6th Ave, Tucson, AZ', zipCode: '85701', coordinates: point(32.2226, -110.9747), status: 'active', contactInfo: { phone: '+1-555-0148', email: 'tucson@mccs.com' } }
  ,{ storeID: 'ST049', storeName: 'MCCS Orlando Store', storeLocation: '400 S Orange Ave, Orlando, FL', zipCode: '32801', coordinates: point(28.5383, -81.3792), status: 'active', contactInfo: { phone: '+1-555-0149', email: 'orlando@mccs.com' } }
  ,{ storeID: 'ST050', storeName: 'MCCS Philadelphia Store', storeLocation: '654 Market Street, Philadelphia, PA', zipCode: '19106', coordinates: point(39.9526, -75.1652), status: 'active', contactInfo: { phone: '+1-555-0150', email: 'philadelphia@mccs.com' } }
];

// Seed stores data
export const seedStores = async (req, res) => {
    try {
        // In-bounds filter
        const inBounds = sampleStores.filter(s => {
          const [lng, lat] = s.coordinates.coordinates;
          return lat >= MIN_LAT && lat <= MAX_LAT && lng >= MIN_LNG && lng <= MAX_LNG;
        });

        // Upsert by storeID so we add/update without wiping existing data
        const ops = inBounds.map(s => ({
          updateOne: {
            filter: { storeID: s.storeID },
            update: { $set: s },
            upsert: true
          }
        }));

        const result = await Store.bulkWrite(ops);
        const upserted = result.upsertedCount || 0;
        const modified = result.modifiedCount || 0;
        
        res.status(201).json({
            success: true,
            message: `Stores upserted successfully (created: ${upserted}, updated: ${modified})`,
            counts: { created: upserted, updated: modified }
        });
    } catch (error) {
        console.error('Error seeding stores:', error);
        res.status(500).json({
            success: false,
            message: 'Error seeding stores',
            error: error.message
        });
    }
};

// Clear all stores
export const clearStores = async (req, res) => {
    try {
        const result = await Store.deleteMany({});
        
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} stores cleared successfully`
        });
    } catch (error) {
        console.error('Error clearing stores:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing stores',
            error: error.message
        });
    }
};