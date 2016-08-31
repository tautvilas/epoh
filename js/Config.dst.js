var Config = {
  SECTOR_WIDTH: 6,
  SECTOR_HEIGHT: 6,
  RESOURCES_PER_SECTOR: 2,
  MAP_SEED: 7892221,

  FIELD_DAMAGE: 0,

  DISABLED_DAMAGE: 5,
  DISABLE_TIMEOUT: 2,

  STARTING_MONEY: 300,
  STARTING_POWER: 100,
  BASE_MONEY: 50,
  MINE_MONEY: 25,
  UNIT_SUPPORT: 5,

  TICK_LENGTH: 60000,
  ROUND_LENGTH: 300000,

  MOCK_PLAYERS: [{name: 'bobby', sector: 'A'}],
  MOCK_UNITS: [
    {player: 'jhonny', name: 'marine', coords: '2 1' },
    {player: 'bobby', name: 'marine', coords: '2 0' },
    {player: 'bobby', name: 'marine', coords: '3 0' }
  ],

  GOD_MODE: true,
  PRODUCTION: false,
  PORT: 8080,
  USERNAME_VIEW: false,
  DEBUG_VIEW: false,
  SHROUD: true

};

module.exports = Config;
