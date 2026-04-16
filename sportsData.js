// sportsData.js — Complete sports database
export var CRICKET_TEAMS = {
  international: ['India','Australia','England','Pakistan','South Africa','New Zealand','West Indies','Sri Lanka','Bangladesh','Afghanistan','Zimbabwe','Ireland','Scotland','Netherlands','UAE','Nepal','Namibia','Kenya','Canada','Oman'],
  ipl: ['Chennai Super Kings (CSK)','Mumbai Indians (MI)','Royal Challengers Bengaluru (RCB)','Kolkata Knight Riders (KKR)','Delhi Capitals (DC)','Sunrisers Hyderabad (SRH)','Rajasthan Royals (RR)','Punjab Kings (PBKS)','Lucknow Super Giants (LSG)','Gujarat Titans (GT)'],
  psl: ['Karachi Kings','Lahore Qalandars','Islamabad United','Quetta Gladiators','Peshawar Zalmi','Multan Sultans'],
  bbl: ['Sydney Sixers','Melbourne Stars','Perth Scorchers','Brisbane Heat','Adelaide Strikers','Hobart Hurricanes','Melbourne Renegades','Sydney Thunder'],
  sa20: ['Joburg Super Kings','Sunrisers Eastern Cape','MI Cape Town','Paarl Royals','Durban Super Giants','Pretoria Capitals'],
};

export var CRICKET_PLAYERS = {
  india: ['Virat Kohli','Rohit Sharma','Jasprit Bumrah','MS Dhoni','Hardik Pandya','KL Rahul','Shubman Gill','Rishabh Pant','Ravindra Jadeja','Mohammed Shami','Yashasvi Jaiswal','Suryakumar Yadav','Arshdeep Singh','Axar Patel','Kuldeep Yadav'],
  australia: ['Pat Cummins','Steve Smith','David Warner','Glenn Maxwell','Mitchell Starc','Josh Hazlewood','Cameron Green','Travis Head','Marnus Labuschagne','Adam Zampa'],
  england: ['Ben Stokes','Joe Root','Jos Buttler','Jofra Archer','Sam Curran','Harry Brook','Zak Crawley','Mark Wood'],
  pakistan: ['Babar Azam','Shaheen Afridi','Mohammad Rizwan','Shadab Khan','Fakhar Zaman','Haris Rauf','Naseem Shah','Imam-ul-Haq'],
  all: ['Virat Kohli','Rohit Sharma','Babar Azam','Steve Smith','Joe Root','Kane Williamson','Ben Stokes','Pat Cummins','Jasprit Bumrah','Shaheen Afridi','Jos Buttler','MS Dhoni','Rishabh Pant','David Warner','Glenn Maxwell','Hardik Pandya','KL Rahul','Shubman Gill','Yashasvi Jaiswal','Suryakumar Yadav'],
};

export var CRICKET_MATCHES = {
  ipl: [
    {label:'CSK vs MI',desc:'IPL 2025'},{label:'RCB vs KKR',desc:'IPL 2025'},{label:'DC vs RR',desc:'IPL 2025'},
    {label:'SRH vs PBKS',desc:'IPL 2025'},{label:'GT vs LSG',desc:'IPL 2025'},{label:'MI vs RCB',desc:'IPL 2025'},
    {label:'KKR vs CSK',desc:'IPL 2025'},{label:'RR vs DC',desc:'IPL 2025'},{label:'PBKS vs GT',desc:'IPL 2025'},
    {label:'LSG vs SRH',desc:'IPL 2025'},
  ],
  international: [
    {label:'India vs Australia',desc:'Test/ODI/T20'},{label:'India vs England',desc:'Test/ODI/T20'},
    {label:'India vs Pakistan',desc:'T20I'},{label:'Australia vs England',desc:'Ashes'},
    {label:'India vs New Zealand',desc:'Test/ODI'},{label:'Pakistan vs England',desc:'Test/T20'},
    {label:'South Africa vs India',desc:'ODI/Test'},{label:'West Indies vs India',desc:'T20I'},
  ],
};

export var CRICKET_BET_TYPES = [
  {label:'Match Winner',desc:'Which team wins the match'},
  {label:'Toss Winner',desc:'Who wins the coin toss'},
  {label:'Top Batsman',desc:'Highest scorer in the match'},
  {label:'Top Bowler',desc:'Most wickets in the match'},
  {label:'Total Runs Over/Under',desc:'Runs above/below a set line'},
  {label:'Highest Opening Partnership',desc:'Team with bigger opening stand'},
  {label:'Man of the Match',desc:'Best player of the match'},
  {label:'1st Wicket Method',desc:'Caught/Bowled/LBW/Run Out'},
  {label:'Century Scored',desc:'Will any batsman score 100+'},
  {label:'5-Wicket Haul',desc:'Will any bowler take 5+ wickets'},
  {label:'Super Over',desc:'Will match go to super over'},
  {label:'Fall of 1st Wicket',desc:'Score when first wicket falls'},
  {label:'Innings Runs',desc:'Total runs in an innings'},
  {label:'Total Sixes',desc:'Number of sixes in the match'},
  {label:'Total Fours',desc:'Number of fours in the match'},
  {label:'Player to Score 50+',desc:'Which player scores a half-century'},
  {label:'Highest Score Team',desc:'Which team posts higher score'},
];

export var FOOTBALL_TEAMS = {
  international: ['Brazil','France','Argentina','England','Spain','Germany','Portugal','Netherlands','Italy','Belgium','Croatia','Uruguay','Colombia','Mexico','USA','Japan','South Korea','Morocco','Senegal','Australia','India','Saudi Arabia'],
  premierLeague: ['Manchester City','Arsenal','Liverpool','Chelsea','Manchester United','Tottenham Hotspur','Newcastle United','Aston Villa','Brighton','West Ham United','Crystal Palace','Brentford','Fulham','Wolves'],
  laLiga: ['Real Madrid','FC Barcelona','Atletico Madrid','Sevilla','Real Betis','Valencia','Athletic Bilbao','Real Sociedad','Villarreal'],
  championsLeague: ['Real Madrid','Manchester City','Bayern Munich','PSG','Liverpool','Chelsea','Barcelona','Juventus','AC Milan','Inter Milan','Borussia Dortmund','Ajax','Porto','Benfica','Atletico Madrid'],
  isl: ['Mumbai City FC','ATK Mohun Bagan','Bengaluru FC','Chennaiyin FC','Kerala Blasters','Goa FC','Odisha FC','Hyderabad FC','East Bengal','NorthEast United','Jamshedpur FC','Punjab FC'],
};

export var FOOTBALL_PLAYERS = {
  topStars: ['Erling Haaland','Kylian Mbappe','Vinicius Jr','Lamine Yamal','Mohamed Salah','Kevin De Bruyne','Harry Kane','Jude Bellingham','Lionel Messi','Cristiano Ronaldo','Neymar Jr','Pedri','Gavi','Robert Lewandowski','Phil Foden','Bukayo Saka','Trent Alexander-Arnold','Rodri','Ruben Dias'],
};

export var FOOTBALL_MATCHES = [
  {label:'Real Madrid vs Barcelona',desc:'La Liga El Clasico'},
  {label:'Manchester City vs Arsenal',desc:'Premier League'},
  {label:'Liverpool vs Manchester United',desc:'Premier League'},
  {label:'PSG vs Marseille',desc:'Ligue 1'},
  {label:'Bayern Munich vs Borussia Dortmund',desc:'Bundesliga'},
  {label:'Inter Milan vs AC Milan',desc:'Serie A Derby'},
  {label:'Chelsea vs Tottenham',desc:'Premier League'},
  {label:'ATK Mohun Bagan vs Mumbai City FC',desc:'ISL'},
];

export var FOOTBALL_BET_TYPES = [
  {label:'Match Result (1X2)',desc:'Home Win / Draw / Away Win'},
  {label:'Both Teams to Score',desc:'Will both teams score?'},
  {label:'Over/Under 2.5 Goals',desc:'Total goals above/below 2.5'},
  {label:'Over/Under 1.5 Goals',desc:'Total goals above/below 1.5'},
  {label:'Asian Handicap',desc:'Team wins with goal handicap'},
  {label:'First Goal Scorer',desc:'Which player scores first'},
  {label:'Anytime Goalscorer',desc:'Player scores at any point'},
  {label:'Correct Score',desc:'Exact final score'},
  {label:'Half Time / Full Time',desc:'Result at HT and FT'},
  {label:'Total Corners Over/Under',desc:'Corners above/below line'},
  {label:'Total Cards Over/Under',desc:'Yellow/red cards count'},
  {label:'Clean Sheet',desc:'Team keeps zero goals conceded'},
  {label:'Double Chance',desc:'Cover two of three outcomes'},
  {label:'Draw No Bet',desc:'Stake returned if draw'},
];

export var TENNIS_PLAYERS = {
  menATP: ['Carlos Alcaraz','Novak Djokovic','Jannik Sinner','Daniil Medvedev','Alexander Zverev','Stefanos Tsitsipas','Andrey Rublev','Taylor Fritz','Casper Ruud','Holger Rune','Tommy Paul','Ben Shelton','Frances Tiafoe','Lorenzo Musetti','Grigor Dimitrov'],
  womenWTA: ['Aryna Sabalenka','Iga Swiatek','Coco Gauff','Elena Rybakina','Jessica Pegula','Madison Keys','Emma Raducanu','Barbora Krejcikova','Naomi Osaka','Ons Jabeur'],
  all: ['Carlos Alcaraz','Novak Djokovic','Jannik Sinner','Daniil Medvedev','Alexander Zverev','Aryna Sabalenka','Iga Swiatek','Coco Gauff','Elena Rybakina','Stefanos Tsitsipas','Andrey Rublev'],
};

export var TENNIS_MATCHES = [
  {label:'Alcaraz vs Djokovic',desc:'Grand Slam'},{label:'Sinner vs Medvedev',desc:'ATP'},
  {label:'Swiatek vs Sabalenka',desc:'WTA'},{label:'Gauff vs Rybakina',desc:'WTA'},
  {label:'Alcaraz vs Sinner',desc:'ATP Finals'},{label:'Djokovic vs Zverev',desc:'ATP'},
];

export var TENNIS_BET_TYPES = [
  {label:'Match Winner',desc:'Who wins the match'},
  {label:'Set Betting',desc:'Exact set score (e.g. 2-0, 2-1)'},
  {label:'Total Games Over/Under',desc:'Total games in match'},
  {label:'Total Sets',desc:'How many sets will be played'},
  {label:'First Set Winner',desc:'Who wins the first set'},
  {label:'Game Handicap',desc:'Player wins with game handicap'},
  {label:'To Win a Set',desc:'Will underdog win at least one set'},
  {label:'Tiebreak in Match',desc:'Will there be a tiebreak'},
  {label:'Ace Count Over/Under',desc:'Total aces above/below line'},
  {label:'Double Fault Over/Under',desc:'Total double faults'},
];

export var CHESS_PLAYERS = ['Magnus Carlsen','Fabiano Caruana','Hikaru Nakamura','Ian Nepomniachtchi','Ding Liren','Wesley So','Anish Giri','Levon Aronian','Alireza Firouzja','Viswanathan Anand','Praggnanandhaa R','Dommaraju Gukesh','Arjun Erigaisi'];

export var CHESS_BET_TYPES = [
  {label:'Match Winner',desc:'Who wins the match/tournament'},
  {label:'Game Result',desc:'Win / Draw / Loss for white'},
  {label:'Number of Moves Over/Under',desc:'Game lasts over/under X moves'},
  {label:'Tournament Winner',desc:'Who wins the entire tournament'},
  {label:'Draw Bet',desc:'Will game end in draw'},
  {label:'Opening Played',desc:'Which opening will be used'},
];

// Smart match suggestions based on sport
export function getMatchesForSport(sport) {
  var s = (sport||'').toLowerCase();
  if (s.includes('cricket')) return [].concat(CRICKET_MATCHES.ipl, CRICKET_MATCHES.international);
  if (s.includes('football')||s.includes('soccer')) return FOOTBALL_MATCHES;
  if (s.includes('tennis')) return TENNIS_MATCHES;
  return [];
}

export function getBetTypesForSport(sport) {
  var s = (sport||'').toLowerCase();
  if (s.includes('cricket')) return CRICKET_BET_TYPES;
  if (s.includes('football')||s.includes('soccer')) return FOOTBALL_BET_TYPES;
  if (s.includes('tennis')) return TENNIS_BET_TYPES;
  if (s.includes('chess')) return CHESS_BET_TYPES;
  return [];
}

export function getPlayersForSport(sport) {
  var s = (sport||'').toLowerCase();
  if (s.includes('cricket')) return CRICKET_PLAYERS.all;
  if (s.includes('football')||s.includes('soccer')) return FOOTBALL_PLAYERS.topStars;
  if (s.includes('tennis')) return TENNIS_PLAYERS.all;
  if (s.includes('chess')) return CHESS_PLAYERS;
  return [];
}

export function getTeamsForSport(sport) {
  var s = (sport||'').toLowerCase();
  if (s.includes('cricket')) return [].concat(CRICKET_TEAMS.international,CRICKET_TEAMS.ipl,CRICKET_TEAMS.psl,CRICKET_TEAMS.bbl);
  if (s.includes('football')||s.includes('soccer')) return [].concat(FOOTBALL_TEAMS.international,FOOTBALL_TEAMS.premierLeague,FOOTBALL_TEAMS.isl);
  return [];
}

// Auto-tag risky bets
export function autoTagBet(betLabel) {
  var tags = [];
  var l = (betLabel||'').toLowerCase();
  if (l.includes('toss')) tags.push('toss','risky');
  if (l.includes('player')) tags.push('player-bet');
  if (l.includes('parlay')||l.includes('accumulator')) tags.push('parlay','high-risk');
  if (l.includes('correct score')) tags.push('long-shot');
  if (l.includes('handicap')) tags.push('handicap');
  return tags;
}
