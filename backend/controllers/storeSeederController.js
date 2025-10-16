import Store from '../models/Store.js';

// Sample store data for seeding
const sampleStores = [
  {
    storeID: 'ST001',
    storeName: 'MCCS Downtown Store',
    storeLocation: '123 Main Street, Downtown',
    zipCode: '10001',
    coordinates: {
      latitude: 40.7589,
      longitude: -73.9851
    },
    status: 'active',
    contactInfo: {
      phone: '+1-555-0101',
      email: 'downtown@mccs.com'
    }
  },
  {
    storeID: 'ST002',
    storeName: 'MCCS Midtown Store',
    storeLocation: '456 Broadway, Midtown',
    zipCode: '10018',
    coordinates: {
      latitude: 40.7505,
      longitude: -73.9934
    },
    status: 'active',
    contactInfo: {
      phone: '+1-555-0102',
      email: 'midtown@mccs.com'
    }
  },
  {
    storeID: 'ST003',
    storeName: 'MCCS Uptown Store',
    storeLocation: '789 5th Avenue, Uptown',
    zipCode: '10022',
    coordinates: {
      latitude: 40.7614,
      longitude: -73.9776
    },
    status: 'active',
    contactInfo: {
      phone: '+1-555-0103',
      email: 'uptown@mccs.com'
    }
  },
  {
    storeID: 'ST004',
    storeName: 'MCCS Brooklyn Store',
    storeLocation: '321 Atlantic Avenue, Brooklyn',
    zipCode: '11201',
    coordinates: {
      latitude: 40.6892,
      longitude: -73.9442
    },
    status: 'active',
    contactInfo: {
      phone: '+1-555-0104',
      email: 'brooklyn@mccs.com'
    }
  },
  {
    storeID: 'ST005',
    storeName: 'MCCS Queens Store',
    storeLocation: '654 Northern Boulevard, Queens',
    zipCode: '11354',
    coordinates: {
      latitude: 40.7282,
      longitude: -73.7949
    },
    status: 'maintenance',
    contactInfo: {
      phone: '+1-555-0105',
      email: 'queens@mccs.com'
    }
  },
  {
    storeID: 'ST006',
    storeName: 'MCCS Bronx Store',
    storeLocation: '987 Fordham Road, Bronx',
    zipCode: '10458',
    coordinates: {
      latitude: 40.8448,
      longitude: -73.8648
    },
    status: 'inactive',
    contactInfo: {
      phone: '+1-555-0106',
      email: 'bronx@mccs.com'
    }
  },
  {
    storeID: 'ST007',
    storeName: 'MCCS Manhattan Store',
    storeLocation: '234 Park Avenue, Manhattan',
    zipCode: '10010',
    coordinates: {
      latitude: 40.7505,
      longitude: -73.9934
    },
    status: 'active',
    contactInfo: {
      phone: '+1-555-0107',
      email: 'manhattan@mccs.com'
    }
  },
  {
    storeID: 'ST008',
    storeName: 'MCCS Staten Island Store',
    storeLocation: '456 Richmond Avenue, Staten Island',
    zipCode: '10314',
    coordinates: {
      latitude: 40.6415,
      longitude: -74.0776
    },
    status: 'active',
    contactInfo: {
      phone: '+1-555-0108',
      email: 'staten@mccs.com'
    }
  },
  {
    storeID: 'ST009',
    storeName: 'MCCS Financial District Store',
    storeLocation: '789 Wall Street, Financial District',
    zipCode: '10005',
    coordinates: {
      latitude: 40.7074,
      longitude: -74.0113
    },
    status: 'active',
    contactInfo: {
      phone: '+1-555-0109',
      email: 'financial@mccs.com'
    }
  },
  {
    storeID: 'ST010',
    storeName: 'MCCS Times Square Store',
    storeLocation: '321 42nd Street, Times Square',
    zipCode: '10036',
    coordinates: {
      latitude: 40.7580,
      longitude: -73.9855
    },
    status: 'maintenance',
    contactInfo: {
      phone: '+1-555-0110',
      email: 'timessquare@mccs.com'
    }
  },
  {
    storeID: 'ST011',
    storeName: 'MCCS Central Park Store',
    storeLocation: '654 Central Park West, Upper West Side',
    zipCode: '10024',
    coordinates: {
      latitude: 40.7829,
      longitude: -73.9654
    },
    status: 'active',
    contactInfo: {
      phone: '+1-555-0111',
      email: 'centralpark@mccs.com'
    }
  },
  {
    storeID: 'ST012',
    storeName: 'MCCS East Village Store',
    storeLocation: '987 2nd Avenue, East Village',
    zipCode: '10003',
    coordinates: {
      latitude: 40.7282,
      longitude: -73.9857
    },
    status: 'active',
    contactInfo: {
      phone: '+1-555-0112',
      email: 'eastvillage@mccs.com'
    }
  },
  {
    storeID: 'ST013',
    storeName: 'MCCS SoHo Store',
    storeLocation: '123 Spring Street, SoHo',
    zipCode: '10012',
    coordinates: {
      latitude: 40.7231,
      longitude: -74.0026
    },
    status: 'inactive',
    contactInfo: {
      phone: '+1-555-0113',
      email: 'soho@mccs.com'
    }
  },
  {
    storeID: 'ST014',
    storeName: 'MCCS Greenwich Village Store',
    storeLocation: '456 Bleecker Street, Greenwich Village',
    zipCode: '10014',
    coordinates: {
      latitude: 40.7336,
      longitude: -74.0027
    },
    status: 'active',
    contactInfo: {
      phone: '+1-555-0114',
      email: 'greenwich@mccs.com'
    }
  },
  {
    storeID: 'ST015',
    storeName: 'MCCS Upper East Side Store',
    storeLocation: '789 Lexington Avenue, Upper East Side',
    zipCode: '10021',
    coordinates: {
      latitude: 40.7736,
      longitude: -73.9566
    },
    status: 'active',
    contactInfo: {
      phone: '+1-555-0115',
      email: 'uppereast@mccs.com'
    }
  }
];

// Seed stores data
export const seedStores = async (req, res) => {
    try {
        // Clear existing stores (optional - remove this if you want to keep existing data)
        await Store.deleteMany({});
        
        // Insert sample stores
        const createdStores = await Store.insertMany(sampleStores);
        
        res.status(201).json({
            success: true,
            message: `${createdStores.length} stores seeded successfully`,
            data: createdStores
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