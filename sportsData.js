// sportsData.js — Complete sports database for autocomplete/suggestions

export var CRICKET_TEAMS = {
  international: [
    'India', 'Australia', 'England', 'Pakistan', 'South Africa',
    'New Zealand', 'West Indies', 'Sri Lanka', 'Bangladesh', 'Afghanistan',
    'Zimbabwe', 'Ireland', 'Scotland', 'Netherlands', 'UAE',
    'Nepal', 'Namibia', 'Kenya', 'Canada', 'Oman',
  ],
  ipl: [
    'Chennai Super Kings (CSK)', 'Mumbai Indians (MI)',
    'Royal Challengers Bengaluru (RCB)', 'Kolkata Knight Riders (KKR)',
    'Delhi Capitals (DC)', 'Sunrisers Hyderabad (SRH)',
    'Rajasthan Royals (RR)', 'Punjab Kings (PBKS)',
    'Lucknow Super Giants (LSG)', 'Gujarat Titans (GT)',
  ],
  psl: [
    'Karachi Kings', 'Lahore Qalandars', 'Islamabad United',
    'Quetta Gladiators', 'Peshawar Zalmi', 'Multan Sultans',
  ],
  bbl: [
    'Sydney Sixers', 'Melbourne Stars', 'Perth Scorchers',
    'Brisbane Heat', 'Adelaide Strikers', 'Hobart Hurricanes',
    'Melbourne Renegades', 'Sydney Thunder',
  ],
  sa20: [
    'Joburg Super Kings', 'Sunrisers Eastern Cape', 'MI Cape Town',
    'Paarl Royals', 'Durban Super Giants', 'Pretoria Capitals',
  ],
};

export var CRICKET_PLAYERS = {
  india: ['Virat Kohli','Rohit Sharma','Jasprit Bumrah','MS Dhoni','Hardik Pandya',
    'KL Rahul','Shubman Gill','Rishabh Pant','Ravindra Jadeja','Mohammed Shami',
    'Yashasvi Jaiswal','Suryakumar Yadav','Arshdeep Singh','Axar Patel','Kuldeep Yadav'],
  australia: ['Pat Cummins','Steve Smith','David Warner','Glenn Maxwell','Mitchell Starc',
    'Josh Hazlewood','Cameron Green','Travis Head','Marnus Labuschagne','Adam Zampa'],
  england: ['Ben Stokes','Joe Root','Jos Buttler','Jofra Archer','Sam Curran',
    'Harry Brook','Zak Crawley','Mark Wood','Stuart Broad','James Anderson'],
  pakistan: ['Babar Azam','Shaheen Afridi','Mohammad Rizwan','Shadab Khan',
    'Fakhar Zaman','Haris Rauf','Naseem Shah','Imam-ul-Haq','Iftikhar Ahmed'],
  newzealand: ['Kane Williamson','Trent Boult','Tim Southee','Devon Conway',
    'Daryl Mitchell','Glenn Phillips','Mitchell Santner','Finn Allen'],
};

export var CRICKET_BET_TYPES = [
  { label: 'Match Winner',         desc: 'Which team wins the match' },
  { label: 'Toss Winner',          desc: 'Who wins the coin toss' },
  { label: 'Top Batsman',          desc: 'Highest scorer in the match' },
  { label: 'Top Bowler',           desc: 'Most wickets in the match' },
  { label: 'Total Runs Over/Under',desc: 'Total runs above/below a line' },
  { label: 'Highest Opening Partnership', desc: 'Team with bigger opening stand' },
  { label: 'Man of the Match',     desc: 'Player of the match' },
  { label: '1st Wicket Method',    desc: 'How first wicket falls (caught/bowled/LBW)' },
  { label: 'Century Scored',       desc: 'Will any batsman score 100+' },
  { label: '5-wicket Haul',        desc: 'Will any bowler take 5+ wickets' },
  { label: 'Super Over',           desc: 'Will match go to super over' },
  { label: 'Fall of 1st Wicket',   desc: 'Score at which first wicket falls' },
  { label: 'Innings Runs',         desc: 'Total runs in an innings' },
  { label: '6s Scored',            desc: 'Total sixes in the match' },
  { label: '4s Scored',            desc: 'Total fours in the match' },
];

export var FOOTBALL_TEAMS = {
  international: [
    'Brazil','France','Argentina','England','Spain','Germany',
    'Portugal','Netherlands','Italy','Belgium','Croatia',
    'Uruguay','Colombia','Mexico','USA','Japan','South Korea',
    'Morocco','Senegal','Australia','India','Saudi Arabia',
  ],
  premierLeague: [
    'Manchester City','Arsenal','Liverpool','Chelsea','Manchester United',
    'Tottenham Hotspur','Newcastle United','Aston Villa','Brighton',
    'West Ham United','Crystal Palace','Brentford','Fulham','Wolves',
  ],
  laLiga: [
    'Real Madrid','FC Barcelona','Atletico Madrid','Sevilla',
    'Real Betis','Valencia','Athletic Bilbao','Real Sociedad','Villarreal',
  ],
  championsLeague: [
    'Real Madrid','Manchester City','Bayern Munich','PSG',
    'Liverpool','Chelsea','Barcelona','Juventus','AC Milan','Inter Milan',
    'Borussia Dortmund','Ajax','Porto','Benfica','Atletico Madrid',
  ],
  isl: [
    'Mumbai City FC','ATK Mohun Bagan','Bengaluru FC','Chennaiyin FC',
    'Kerala Blasters','Goa FC','Odisha FC','Hyderabad FC',
    'East Bengal','NorthEast United','Jamshedpur FC','Punjab FC',
  ],
};

export var FOOTBALL_PLAYERS = {
  topStars: ['Erling Haaland','Kylian Mbappe','Vinicius Jr','Lamine Yamal',
    'Mohamed Salah','Kevin De Bruyne','Harry Kane','Jude Bellingham',
    'Lionel Messi','Cristiano Ronaldo','Neymar Jr','Pedri','Gavi',
    'Robert Lewandowski','Phil Foden','Bukayo Saka','Trent Alexander-Arnold'],
};

export var FOOTBALL_BET_TYPES = [
  { label: 'Match Result (1X2)',    desc: 'Home Win / Draw / Away Win' },
  { label: 'Both Teams to Score',  desc: 'Will both teams score?' },
  { label: 'Over/Under Goals',     desc: 'Total goals above/below line (e.g. 2.5)' },
  { label: 'Asian Handicap',       desc: 'Team wins with goal handicap' },
  { label: 'First Goal Scorer',    desc: 'Which player scores first' },
  { label: 'Anytime Goalscorer',   desc: 'Player scores at any point' },
  { label: 'Correct Score',        desc: 'Exact final score' },
  { label: 'Half Time / Full Time',desc: 'Result at HT and FT' },
  { label: 'Total Corners',        desc: 'Over/under on corners' },
  { label: 'Total Cards',          desc: 'Over/under on yellow/red cards' },
  { label: 'Clean Sheet',          desc: 'Will a team keep a clean sheet' },
  { label: 'Double Chance',        desc: 'Cover two of three match outcomes' },
  { label: 'Draw No Bet',          desc: 'Bet returned if draw' },
  { label: 'Next Goal Scorer',     desc: 'Who scores the next goal' },
];

export var TENNIS_PLAYERS = {
  menATP: ['Carlos Alcaraz','Novak Djokovic','Jannik Sinner','Daniil Medvedev',
    'Alexander Zverev','Stefanos Tsitsipas','Andrey Rublev','Taylor Fritz',
    'Casper Ruud','Holger Rune','Tommy Paul','Ben Shelton','Frances Tiafoe',
    'Lorenzo Musetti','Grigor Dimitrov'],
  womenWTA: ['Aryna Sabalenka','Iga Swiatek','Coco Gauff','Elena Rybakina',
    'Jessica Pegula','Madison Keys','Emma Raducanu','Barbora Krejcikova',
    'Caroline Wozniacki','Naomi Osaka','Ons Jabeur','Belinda Bencic'],
};

export var TENNIS_TOURNAMENTS = [
  'Australian Open','French Open (Roland Garros)','Wimbledon','US Open',
  'ATP Finals','Indian Wells Masters','Miami Open','Madrid Open',
  'Rome Masters','Canada Masters','Cincinnati Masters','Paris Masters',
  'Dubai Championships','Qatar Open','Barcelona Open',
];

export var TENNIS_BET_TYPES = [
  { label: 'Match Winner',         desc: 'Who wins the match' },
  { label: 'Set Betting',          desc: 'Exact set score (e.g. 2-0, 2-1)' },
  { label: 'Total Games Over/Under', desc: 'Total games in match' },
  { label: 'Total Sets',           desc: 'How many sets will be played' },
  { label: 'First Set Winner',     desc: 'Who wins the first set' },
  { label: 'Game Handicap',        desc: 'Player wins with game handicap' },
  { label: 'To Win a Set',         desc: 'Will underdog win at least one set' },
  { label: 'Tiebreak in Match',    desc: 'Will there be a tiebreak' },
  { label: 'Ace Count Over/Under', desc: 'Total aces above/below line' },
  { label: 'Double Fault Over/Under', desc: 'Total double faults' },
];

export var CHESS_PLAYERS = [
  'Magnus Carlsen','Fabiano Caruana','Hikaru Nakamura','Ian Nepomniachtchi',
  'Ding Liren','Wesley So','Anish Giri','Levon Aronian','Alireza Firouzja',
  'Viswanathan Anand','Teimour Radjabov','Shakhriyar Mamedyarov',
  'Sergey Karjakin','Maxime Vachier-Lagrave','Richard Rapport',
  'Praggnanandhaa R','Dommaraju Gukesh','Arjun Erigaisi',
];

export var CHESS_BET_TYPES = [
  { label: 'Match Winner',         desc: 'Who wins the match/tournament' },
  { label: 'Game Result',          desc: 'Win / Draw / Loss for white' },
  { label: 'Number of Moves',      desc: 'Game lasts over/under X moves' },
  { label: 'Opening Played',       desc: 'Which opening will be used' },
  { label: 'Tournament Winner',    desc: 'Who wins the tournament' },
  { label: 'Draw Bet',             desc: 'Will game end in draw' },
];

// All-in-one lookup by sport
export function getBetTypesForSport(sport) {
  var s = (sport || '').toLowerCase();
  if (s.includes('cricket')) return CRICKET_BET_TYPES;
  if (s.includes('football') || s.includes('soccer')) return FOOTBALL_BET_TYPES;
  if (s.includes('tennis')) return TENNIS_BET_TYPES;
  if (s.includes('chess')) return CHESS_BET_TYPES;
  return [];
}

export function getTeamsForSport(sport) {
  var s = (sport || '').toLowerCase();
  if (s.includes('cricket')) {
    return [].concat(
      CRICKET_TEAMS.international,
      CRICKET_TEAMS.ipl,
      CRICKET_TEAMS.psl,
      CRICKET_TEAMS.bbl,
      CRICKET_TEAMS.sa20
    );
  }
  if (s.includes('football') || s.includes('soccer')) {
    return [].concat(
      FOOTBALL_TEAMS.international,
      FOOTBALL_TEAMS.premierLeague,
      FOOTBALL_TEAMS.laLiga,
      FOOTBALL_TEAMS.isl
    );
  }
  if (s.includes('tennis')) return TENNIS_TOURNAMENTS;
  return [];
}
