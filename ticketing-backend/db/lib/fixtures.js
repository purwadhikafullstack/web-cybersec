// event_date values are relative to seed time so they always look "upcoming".
const DAY_MS = 24 * 60 * 60 * 1000;

function daysFromNow(days) {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

function eventFixtures() {
  return [
    {
      title: 'Jakarta Indie Music Fest',
      description: 'A full day of local indie bands across two stages.',
      event_date: daysFromNow(30),
      price: 250000,
      capacity: 200,
      banner_url: '/events/jakarta-indie-music-fest.png',
    },
    {
      title: 'Tech Conference: Cloud & Security',
      description: 'Talks on cloud architecture, DevSecOps, and AppSec.',
      event_date: daysFromNow(45),
      price: 500000,
      capacity: 150,
      banner_url: '/events/tech-conference-cloud-security.png',
    },
    {
      title: 'Stand-up Comedy Night',
      description: 'An evening of stand-up comedy with local comedians.',
      event_date: daysFromNow(14),
      price: 150000,
      capacity: 80,
      banner_url: '/events/standup-comedy-night.png',
    },
    {
      // Deliberately tiny capacity so overselling (vuln #2) is easy to
      // reproduce with a handful of parallel requests.
      title: 'Flash Sale: VIP Meet & Greet (Limited Seats!)',
      description: 'Extremely limited VIP meet & greet — only a few seats left.',
      event_date: daysFromNow(7),
      price: 1000000,
      capacity: 5,
      banner_url: '/events/flash-sale-vip-meet-greet.png',
    },
  ];
}

module.exports = { eventFixtures };
