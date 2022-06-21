const {username, apiKey, tID, sheetID, team1, team2} = require('./config');
const https = require('follow-redirects').https;
const Challonge = require('simple-challonge-api');
function csvJSON(csv){
		var result = {};
		var lines=csv.split("\n");
		for (var i = 1; i < lines.length; i++) {
			var currentline = lines[i].split("\t");
			result[currentline[1]] = currentline[3];
		}
		return result;
}
const IFTD = new Challonge({
	"username" : username,
	"apiKey" : apiKey,
	"tournamentID" : tID
});
	
IFTD.participants.index().then(async h => {
	let teams = await new Promise((resolve, reject) => {
		https.get(`https://docs.google.com/spreadsheets/d/${sheetID}/export?exportFormat=tsv`, (res) => {
			let data = "";
			res.on('data', (d) => {
				data += d;
			});  
			res.on('end', () => {
				resolve(data);
			});
		});
	});
	let evens = [], odds = [], team = csvJSON(teams);
	for (const a of h) {
		await IFTD.matches.index(a.participant.id).then(userMatches => {
			let score = userMatches.map(i => {
				let authorPlayer = a.participant.id == i.match.player1_id ? 0 : 1;
				return i.match.scores_csv.split("-")[authorPlayer];
			}).reduce((b,c)=>{ return Number(b) + (Number(c) ? Number(c) : 0) },0);
			if (RegExp(team1).test(team[a.participant.username])) { console.log(`[VERBOSE] ${a.participant.username} selected "Waffles" with a score of ${score}`); odds.push(score) }
			else if (RegExp(team2).test(team[a.participant.username])) { console.log(`[VERBOSE] ${a.participant.username} selected "Pancakes" with a score of ${score}`); evens.push(score) }
		})
	}
	console.log(`${team1} ${odds.reduce((a,b) => a + b, 0)/odds.length}`);
	console.log(`${team2} ${evens.reduce((a,b) => a + b, 0)/evens.length}`);
	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.on('data', process.exit.bind(process, 0));
})