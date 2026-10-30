import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTeamSquadCSV } from '../services/googleDriveService';
import { INITIAL_GPL_TEAMS } from '../data/initialGplTeams';

test('INITIAL_GPL_TEAMS has 6 teams with 11 players each', () => {
  assert.equal(INITIAL_GPL_TEAMS.length, 6);
  INITIAL_GPL_TEAMS.forEach((team, idx) => {
    assert.equal(team.teamNumber, idx + 1);
    assert.equal(team.players.length, 11, `Team ${team.name} should have exactly 11 players`);
    // Verify each slot from 1 to 11
    const slots = team.players.map((p) => p.slot);
    assert.deepEqual(slots, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

test('generateTeamSquadCSV formats all 11 players into valid CSV', () => {
  const team = INITIAL_GPL_TEAMS[0];
  const csv = generateTeamSquadCSV(team);

  assert.ok(csv.includes('Gamudawa Premier League (GPL 2026)'));
  assert.ok(csv.includes(team.name));
  assert.ok(csv.includes(team.managerName));
  assert.ok(csv.includes('Charith Jayasuriya'));
  assert.ok(csv.includes('Captain (C)'));
  assert.ok(csv.includes('Vice-Captain (VC)'));
  assert.ok(csv.includes('Slot #,Jersey No,Player Official Name'));

  const lines = csv.split('\r\n').filter((l) => l.trim().length > 0);
  // Should have metadata lines, header line, and 11 player lines
  assert.ok(lines.length >= 17);
});

test('GPL player roles and jersey sizes match official standards', () => {
  const validRoles = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];
  const validSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  INITIAL_GPL_TEAMS.forEach((team) => {
    team.players.forEach((player) => {
      assert.ok(validRoles.includes(player.role), `Invalid role ${player.role}`);
      assert.ok(validSizes.includes(player.jerseySize), `Invalid size ${player.jerseySize}`);
      assert.ok(player.jerseyNumber > 0 && player.jerseyNumber <= 99);
      assert.ok(player.name.length > 2);
    });
  });
});
