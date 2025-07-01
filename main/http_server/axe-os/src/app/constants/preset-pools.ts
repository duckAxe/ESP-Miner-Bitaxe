export type PresetPool = {
  name: string,
  value: {
    url: string,
    port: number
  } | {}
};

export const PRESET_POOLS: PresetPool[] = [
  { name: 'Blitz Pool', value: { url: 'blitzpool.yourdevice.ch', port: 3333 } },
  { name: 'Braiins Solo', value: { url: 'solo.stratum.braiins.com', port: 3333 } },
  { name: 'Nerdminer', value: { url: 'pool.nerdminer.de', port: 3333 } },
  { name: 'Noderunners', value: { url: 'pool.noderunners.network', port: 1337 } },
  { name: 'OCEAN', value: { url: 'mine.ocean.xyz', port: 3334 } },
  { name: 'Parasite', value: { url: 'parasite.wtf', port: 42069 } },
  { name: 'Public Pool', value: { url: 'public-pool.io', port: 21496 } },
  { name: 'Satoshi Radio', value: { url: 'pool.satoshiradio.nl', port: 3333 } },
  { name: 'Solo CKPool', value: { url: 'solo.ckpool.org', port: 3333 } },
  { name: 'Solo CKPool EU', value: { url: 'eusolo.ckpool.org', port: 3333 } },
  { name: 'Solomining', value: { url: 'pool.solomining.de', port: 3333 } },
];
