// Vercel serverless function: GET /api/leetcode
// Fetches public LeetCode stats and lets Vercel's CDN cache the answer for 3 minutes,
// so LeetCode is contacted at most a few times per hour no matter how many people visit.

const USERNAME = 'raynerdcunha';

const QUERY = `
  query userStats($username: String!) {
    matchedUser(username: $username) {
      submitStatsGlobal {
        acSubmissionNum { difficulty count }
      }
    }
  }`;

module.exports = async function handler(req, res) {
  try {
    const r = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com/u/' + USERNAME + '/',
        'User-Agent': 'Mozilla/5.0 (compatible; portfolio-stats)'
      },
      body: JSON.stringify({ query: QUERY, variables: { username: USERNAME } })
    });
    if (!r.ok) throw new Error('LeetCode responded ' + r.status);

    const json = await r.json();
    const rows = json && json.data && json.data.matchedUser &&
      json.data.matchedUser.submitStatsGlobal.acSubmissionNum;
    if (!Array.isArray(rows)) throw new Error('Unexpected response shape');

    const pick = (d) => (rows.find((x) => x.difficulty === d) || {}).count;
    const out = { solved: pick('All'), easy: pick('Easy'), medium: pick('Medium'), hard: pick('Hard') };
    if (![out.solved, out.easy, out.medium, out.hard].every(Number.isFinite)) throw new Error('Missing counts');

    // Cache 3 min at the CDN; serve a stale copy for up to 10 more min while refreshing.
    res.setHeader('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=600');
    res.status(200).json(out);
  } catch (e) {
    // Short cache on failure so we retry soon without hammering LeetCode.
    res.setHeader('Cache-Control', 'public, s-maxage=30');
    res.status(502).json({ error: 'LeetCode stats unavailable' });
  }
};