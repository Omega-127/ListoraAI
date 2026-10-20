/**
 * Test fixtures — sample profile and listing payloads.
 */

export const SAMPLE_PROFILE = {
  id: 'test-profile-001',
  name: 'Brew & Bloom Café',
  address: '42 Maple Street, Springfield, IL 62701',
  phone: '+15550102234',
  regularHours: {
    monday: '07:00-18:00',
    tuesday: '07:00-18:00',
    friday: '07:00-20:00',
    saturday: '08:00-20:00',
    sunday: '09:00-16:00',
  },
  holidayHours: {
    '2026-12-25': 'closed',
  },
  updatedAt: new Date('2026-10-01T00:00:00Z'),
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

export const MOCK_MAPS_A_LISTING = {
  id: 'listing_001',
  name: 'Brew & Bloom Café',
  address: '42 Maple Street, Springfield, IL 62701',
  phone: '+15550102234',
  regularHours: {
    monday: '07:00-18:00',
    tuesday: '07:00-18:00',
    friday: '07:00-20:00',
    saturday: '08:00-20:00',
    sunday: '09:00-16:00',
  },
  holidayHours: {
    '2026-12-25': 'closed',
  },
};

export const MOCK_MAPS_B_LISTING = {
  id: 'listing_002',
  name: 'Brew & Bloom Café',
  address: '42 Maple St, Springfield, IL 62701', // abbreviated
  phone: '(555) 010-2234', // different format
  regularHours: {
    monday: '07:00-18:00',
    friday: '07:00-20:00',
  },
  holidayHours: {},
};

export const MOCK_DIRECTORY_C_LISTING = {
  id: 'listing_003',
  name: 'Brew and Bloom Cafe', // slight name variation
  address: '42 Maple Street, Springfield, Illinois',
  phone: '555-010-2234',
  regularHours: {
    monday: '7am-6pm', // different format
    friday: '7am-8pm',
  },
  holidayHours: {
    '2026-12-25': 'closed',
  },
};
