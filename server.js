const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

// ─── Models ───────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:  { type: String, enum: ['Admin', 'Member'], default: 'Member' },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};
const User = mongoose.model('User', userSchema);

const projectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status:      { type: String, enum: ['Active','Completed','On Hold','Archived'], default: 'Active' },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: { type: String, enum: ['Admin','Member'], default: 'Member' } }],
  deadline: { type: Date },
  color:    { type: String, default: '#0ea5e9' },
}, { timestamps: true });
const Project = mongoose.model('Project', projectSchema);

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status:      { type: String, enum: ['Todo','In Progress','In Review','Done'], default: 'Todo' },
  priority:    { type: String, enum: ['Low','Medium','High','Critical'], default: 'Medium' },
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate:     { type: Date, default: null },
  tags:        [{ type: String }],
  comments: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, text: String, createdAt: { type: Date, default: Date.now } }]
}, { timestamps: true });
const Task = mongoose.model('Task', taskSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const generateToken = (id) => jwt.sign({ id }, SECRET, { expiresIn: '7d' });

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized.' });
    const decoded = jwt.verify(header.split(' ')[1], SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found.' });
    req.user = user;
    next();
  } catch { res.status(401).json({ message: 'Invalid token.' }); }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required.' });
  next();
};

const hasAccess = async (projectId, userId, userRole) => {
  if (userRole === 'Admin') return { access: true, isAdmin: true };
  const p = await Project.findById(projectId);
  if (!p) return { access: false, isAdmin: false };
  const isOwner = p.owner.toString() === userId.toString();
  const member  = p.members.find(m => m.user.toString() === userId.toString());
  return { access: isOwner || !!member, isAdmin: isOwner || member?.role === 'Admin' };
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required.' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered.' });
    const count = await User.countDocuments();
    const user = await User.create({ name, email, password, role: count === 0 ? 'Admin' : (role || 'Member') });
    res.status(201).json({ token: generateToken(user._id), user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'All fields required.' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials.' });
    res.json({ token: generateToken(user._id), user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/auth/me', protect, (req, res) => {
  res.json({ user: { _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
});

// ─── Projects ─────────────────────────────────────────────────────────────────

app.get('/api/projects', protect, async (req, res) => {
  try {
    const projects = await Project.find({ $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] })
      .populate('owner', 'name email').populate('members.user', 'name email').sort({ createdAt: -1 });
    const result = await Promise.all(projects.map(async p => {
      const [taskCount, completedCount, overdueCount] = await Promise.all([
        Task.countDocuments({ project: p._id }),
        Task.countDocuments({ project: p._id, status: 'Done' }),
        Task.countDocuments({ project: p._id, dueDate: { $lt: new Date() }, status: { $ne: 'Done' } }),
      ]);
      return { ...p.toObject(), taskCount, completedCount, overdueCount };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/projects', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, deadline, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required.' });
    const project = await (await Project.create({ name, description, deadline, color, owner: req.user._id })).populate('owner', 'name email');
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/projects/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email').populate('members.user', 'name email');
    if (!project) return res.status(404).json({ message: 'Not found.' });
    const ok = req.user.role === 'Admin' || project.owner._id.toString() === req.user._id.toString() || project.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!ok) return res.status(403).json({ message: 'Access denied.' });
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/projects/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Not found.' });
    if (req.user.role !== 'Admin' && project.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied.' });
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('owner', 'name email').populate('members.user', 'name email');
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/projects/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Not found.' });
    if (req.user.role !== 'Admin' && project.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied.' });
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/projects/:id/members', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Not found.' });
    const { userId, role } = req.body;
    if (project.members.some(m => m.user.toString() === userId)) return res.status(400).json({ message: 'Already a member.' });
    project.members.push({ user: userId, role: role || 'Member' });
    await project.save();
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/projects/:id/members/:userId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Not found.' });
    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    res.json({ message: 'Member removed.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Tasks ────────────────────────────────────────────────────────────────────

// IMPORTANT: /stats/dashboard MUST come before /:id
app.get('/api/tasks/stats/dashboard', protect, async (req, res) => {
  try {
    const userProjects = await Project.find({ $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] }).select('_id');
    const ids = userProjects.map(p => p._id);
    const base = req.user.role === 'Admin' ? {} : { project: { $in: ids } };
    const [total, todo, inProgress, inReview, done, overdue] = await Promise.all([
      Task.countDocuments(base),
      Task.countDocuments({ ...base, status: 'Todo' }),
      Task.countDocuments({ ...base, status: 'In Progress' }),
      Task.countDocuments({ ...base, status: 'In Review' }),
      Task.countDocuments({ ...base, status: 'Done' }),
      Task.countDocuments({ ...base, dueDate: { $lt: new Date() }, status: { $ne: 'Done' } }),
    ]);
    res.json({ total, todo, inProgress, inReview, done, overdue, projects: ids.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/tasks', protect, async (req, res) => {
  try {
    const { project, status, priority, overdue } = req.query;
    let query = {};
    if (project) {
      const { access } = await hasAccess(project, req.user._id, req.user.role);
      if (!access) return res.status(403).json({ message: 'Access denied.' });
      query.project = project;
    } else if (req.user.role !== 'Admin') {
      const ps = await Project.find({ $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] }).select('_id');
      query.project = { $in: ps.map(p => p._id) };
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (overdue === 'true') { query.dueDate = { $lt: new Date() }; query.status = { $ne: 'Done' }; }
    const tasks = await Task.find(query).populate('assignedTo', 'name email').populate('createdBy', 'name email').populate('project', 'name color').sort({ createdAt: -1 }).lean();
    const now = new Date();
    tasks.forEach(t => { t.isOverdue = !!(t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done'); });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/tasks', protect, async (req, res) => {
  try {
    const { title, description, status, priority, project, assignedTo, dueDate, tags } = req.body;
    if (!title || !project) return res.status(400).json({ message: 'Title and project required.' });
    const { access } = await hasAccess(project, req.user._id, req.user.role);
    if (!access) return res.status(403).json({ message: 'Access denied.' });
    const task = await Task.create({ title, description, status, priority, project, assignedTo: assignedTo || null, dueDate: dueDate || null, tags: tags || [], createdBy: req.user._id });
    await task.populate([{ path: 'assignedTo', select: 'name email' }, { path: 'createdBy', select: 'name email' }, { path: 'project', select: 'name color' }]);
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedTo', 'name email').populate('createdBy', 'name email').populate('project', 'name color').populate('comments.user', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const { access } = await hasAccess(task.project._id, req.user._id, req.user.role);
    if (!access) return res.status(403).json({ message: 'Access denied.' });
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const { access, isAdmin } = await hasAccess(task.project, req.user._id, req.user.role);
    if (!access) return res.status(403).json({ message: 'Access denied.' });
    const { title, description, status, priority, assignedTo, dueDate, tags } = req.body;
    if (isAdmin) {
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
      if (tags !== undefined) task.tags = tags;
    }
    if (status !== undefined) task.status = status;
    await task.save();
    await task.populate([{ path: 'assignedTo', select: 'name email' }, { path: 'createdBy', select: 'name email' }, { path: 'project', select: 'name color' }]);
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const { isAdmin } = await hasAccess(task.project, req.user._id, req.user.role);
    if (!isAdmin) return res.status(403).json({ message: 'Admin only.' });
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/tasks/:id/comments', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name email');
    res.json(task.comments[task.comments.length - 1]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Users ────────────────────────────────────────────────────────────────────

app.get('/api/users', protect, async (req, res) => {
  try {
    res.json(await User.find().select('-password').sort({ name: 1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/users/profile', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { name: req.body.name }, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/users/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Admin', 'Member'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, '0.0.0.0', () => console.log('Server on port ' + PORT));
  })
  .catch(err => { console.error('DB error:', err.message); process.exit(1); });
