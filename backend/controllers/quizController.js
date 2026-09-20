const Club = require('../models/Club');
const User = require('../models/User');

const QUIZ_QUESTIONS = [
  {"id":1,"text":"What type of activity excites you most?","opts":["Building apps/websites","Performing on stage","Competing in sports","Solving real-world problems"]},
  {"id":2,"text":"How do you prefer to spend free time?","opts":["Coding or tinkering","Dancing/singing/acting","Outdoor sports/gym","Reading/writing/debating"]},
  {"id":3,"text":"Which skill do you most want to develop?","opts":["Technical/coding skills","Creative/artistic skills","Leadership & teamwork","Communication & writing"]},
  {"id":4,"text":"Your ideal club activity would be?","opts":["Hackathon overnight","Cultural fest performance","Inter-college tournament","Community service drive"]},
  {"id":5,"text":"You're most comfortable when?","opts":["Solving logical puzzles","Expressing yourself creatively","Playing as part of a team","Helping others learn"]},
  {"id":6,"text":"Pick your ideal college memory?","opts":["Winning a coding contest","Rocking the stage at Confluence","Winning at Techspardha sports","Volunteering at an outreach camp"]},
  {"id":7,"text":"What kind of impact do you want to make?","opts":["Build products that matter","Inspire through art/culture","Represent college at sports","Make someone's life better"]},
  {"id":8,"text":"Your friends would describe you as?","opts":["The tech geek","The creative soul","The sporty one","The thoughtful one"]},
  {"id":9,"text":"What do you value most in a club?","opts":["Learning new technical skills","Expressing creativity","Physical fitness & competition","Community & social impact"]},
  {"id":10,"text":"How do you handle pressure?","opts":["Dive into problem-solving","Channel it into performance","Push harder physically","Talk it out and support others"]},
];

exports.questions = (req, res) => {
  res.json(QUIZ_QUESTIONS);
};

exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    const scores = {"Technical":0,"Cultural":0,"Sports":0,"Literary":0,"Social":0,"Management":0};
    const domain_map = [
      ["Technical","Cultural","Sports","Social"],
      ["Technical","Cultural","Sports","Literary"],
      ["Technical","Cultural","Sports","Literary"],
      ["Technical","Cultural","Sports","Social"],
      ["Technical","Cultural","Sports","Social"],
      ["Technical","Cultural","Sports","Social"],
      ["Technical","Cultural","Sports","Social"],
      ["Technical","Cultural","Sports","Literary"],
      ["Technical","Cultural","Sports","Social"],
      ["Technical","Cultural","Sports","Social"],
    ];
    
    answers.slice(0, 10).forEach((ans, i) => {
      if (ans >= 0 && ans <= 3 && i < domain_map.length) {
        const domain = domain_map[i][ans];
        scores[domain]++;
      }
    });

    const sortedDomains = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    const topDomain = sortedDomains[0];

    const clubs = await Club.find({ domain: topDomain }).limit(5);
    const fallback = await Club.find({}).limit(5);
    
    const recommended = clubs.length >= 3 ? clubs.slice(0, 3) : [...clubs, ...fallback.slice(0, 3 - clubs.length)];
    const recIds = recommended.map(c => c._id.toString());

    let aiSummary = `Based on your answers, you lean towards ${topDomain} activities! You'd thrive in clubs that match your passion for `;
    if (topDomain === 'Technical') aiSummary += 'building and creating technology.';
    else if (topDomain === 'Cultural') aiSummary += 'creative expression and performance.';
    else if (topDomain === 'Sports') aiSummary += 'sports and physical competition.';
    else if (topDomain === 'Literary') aiSummary += 'literature and debate.';
    else if (topDomain === 'Social') aiSummary += 'community impact.';
    else aiSummary += 'leadership and entrepreneurship.';

    const result = {
      scores,
      top_domain: topDomain,
      recommended_club_ids: recIds,
      ai_summary: aiSummary
    };

    req.user.quiz_result = result;
    await req.user.save();
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.quizResult = async (req, res) => {
  try {
    const r = req.user.quiz_result;
    if (!r) return res.status(404).json({ detail: 'No quiz result yet' });
    
    const recClubs = [];
    for (const cid of r.recommended_club_ids) {
      const c = await Club.findById(cid);
      if (c) recClubs.push(c);
    }
    
    res.json({ ...r, recommended_clubs: recClubs });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};
