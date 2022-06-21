const {tID, team1, team2, sheetID} = require('./config');
const bfa = require("battlefy-api");
const https = require("follow-redirects").https;
function csvJSON(csv){
	var result = {};
	var lines = csv.split("\n");
	for (var i = 1;i<lines.length;i++) {
		var currentline = lines[i].split("\t");
		result[currentline[1]] = currentline[3];
	}
	return result;
}
bfa.getTournamentData(tID).then(async h => {
	bfa.getTournamentStageMatches(h.stageIDs[0]).then(async j => {
		let teams = await new Promise((resolve, reject) => {
			https.get(`https://docs.google.com/spreadsheets/d/${sheetID}/export?exportFormat=tsv`, (res) => {
				let data = "" ;
				res.on('data', (d) => {
					data += d;
				});  
				res.on('end', () => {
					resolve(data);
				});
			})
		})
		let evens = [], odds = [], team = csvJSON(teams);
		bfa.getTournamentTeams(tID).then(async t => {
			for (const aa of t) {
				let score = 0, len = 0;
				j.filter(n => n.top.team?.name === aa.name).map(a => { 
					score += a.top.score ?? 0; 
					len += a.top.score ? 1 : 0;
				});
				j.filter(n => n.bottom.team?.name === aa.name).map(a => { 
					score += a.bottom.score ?? 0; 
					len += a.bottom.score ? 1 : 0;
				});
				if (RegExp(team1).test(team[aa.name])) { console.log(`[VERBOSE] ${aa.name} selected "Waffles" with a score of ${score}`); odds.push(score) }
				else if (RegExp(team2).test(team[aa.name])) { console.log(`[VERBOSE] ${aa.name} selected "Pancakes" with a score of ${score}`); evens.push(score) }
			}
			console.log(`${team1} ${odds.reduce((a,b) => a + b, 0)/odds.length}`);
			console.log(`${team2} ${evens.reduce((a,b) => a + b, 0)/evens.length}`);
		})
	})
})