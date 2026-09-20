const User = require('../models/User');
const Club = require('../models/Club');
const Review = require('../models/Review');
const Post = require('../models/Post');

// ── BOOKMARKS ─────────────────────────────────────────────────────────

exports.addBookmark = async (req, res) => {
  try {
    const { club_id } = req.body;
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { bookmarks: club_id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.getBookmarks = async (req, res) => {
  try {
    const ids = req.user.bookmarks || [];
    const clubs = [];
    for (const id of ids) {
      const c = await Club.findById(id);
      if (c) clubs.push(c.toJSON());
    }
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.removeBookmark = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { bookmarks: req.params.club_id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

// ── WATCHLIST ─────────────────────────────────────────────────────────

exports.addWatchlist = async (req, res) => {
  try {
    const { club_id, note = '' } = req.body;
    // Remove if already exists
    await User.findByIdAndUpdate(req.user._id, { $pull: { watchlist: { club_id } } });
    // Add new
    const entry = { club_id, note, added_at: new Date() };
    await User.findByIdAndUpdate(req.user._id, { $push: { watchlist: entry } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const result = [];
    for (const item of (req.user.watchlist || [])) {
      const c = await Club.findById(item.club_id);
      if (c) result.push({ ...c.toJSON(), note: item.note, added_at: item.added_at });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { club_id } = req.params;
    const { note } = req.body;
    await User.findOneAndUpdate(
      { _id: req.user._id, "watchlist.club_id": club_id },
      { $set: { "watchlist.$.note": note } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.removeWatchlist = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { watchlist: { club_id: req.params.club_id } } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

// ── REVIEWS ───────────────────────────────────────────────────────────

exports.createReview = async (req, res) => {
  try {
    if (!req.user.email_verified) return res.status(403).json({ detail: 'Email not verified' });
    const { club_id, rating, liked, improved } = req.body;
    
    if (rating < 1 || rating > 5) return res.status(400).json({ detail: 'Rating must be 1-5' });
    const club = await Club.findById(club_id);
    if (!club) return res.status(404).json({ detail: 'Club not found' });
    
    await Review.deleteMany({ club_id, user_id: req.user._id.toString() });
    
    const review = new Review({
      club_id, user_id: req.user._id.toString(), rating, liked, improved
    });
    await review.save();
    
    const allReviews = await Review.find({ club_id }).limit(500);
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await Club.findByIdAndUpdate(club_id, { avg_rating: Math.round(avg * 10) / 10, review_count: allReviews.length });
    
    res.json({ ok: true, avg_rating: Math.round(avg * 10) / 10 });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ club_id: req.params.club_id }).limit(100);
    reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const uid = req.user ? req.user._id.toString() : null;
    const result = await Promise.all(reviews.map(async r => {
      const author = await User.findById(r.user_id);
      return {
        id: r._id,
        rating: r.rating,
        liked: r.liked,
        improved: r.improved,
        created_at: r.created_at,
        author: author ? author.toJSON() : { name: '[deleted]', role: 'student' },
        is_mine: uid && r.user_id === uid
      };
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const r = await Review.findById(req.params.review_id);
    if (!r) return res.status(404).json({ detail: 'Not found' });
    
    if (r.user_id !== req.user._id.toString() && !['club_admin','owner'].includes(req.user.role)) {
      return res.status(403).json({ detail: 'Not allowed' });
    }
    
    await Review.findByIdAndDelete(req.params.review_id);
    
    const allReviews = await Review.find({ club_id: r.club_id }).limit(500);
    const avg = allReviews.length ? allReviews.reduce((sum, x) => sum + x.rating, 0) / allReviews.length : 0;
    
    await Club.findByIdAndUpdate(r.club_id, {
      avg_rating: allReviews.length ? Math.round(avg * 10) / 10 : null,
      review_count: allReviews.length
    });
    
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};

// ── PROFILE ───────────────────────────────────────────────────────────

exports.getProfile = async (req, res) => {
  try {
    const { user_id } = req.params;
    const target = await User.findById(user_id);
    if (!target) return res.status(404).json({ detail: 'User not found' });
    
    const posts = await Post.find({ author_id: user_id, anonymous: { $ne: true } }).limit(20);
    posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const isMe = req.user && req.user._id.toString() === user_id;
    
    res.json({
      user: target.toJSON(),
      bio: target.bio || '',
      post_count: posts.length,
      recent_posts: posts.slice(0, 5).map(p => ({ id: p._id, title: p.title, created_at: p.created_at })),
      is_me: isMe
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
};
