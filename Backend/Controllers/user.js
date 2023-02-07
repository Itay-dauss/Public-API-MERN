const express = require('express'),
  {StatusCodes} = require('http-status-codes'),
  hash = require('object-hash'),
  User = require('../Models/user'),
  Api = require('../Models/api'),
  Bookmark = require('../Models/bookmark'),
  router = express.Router();

//TODO NEED TO ADD ERROR HANDLING!!!!!!!!!

router.get('/', async (req, res) => {
  try {
    const users = await User.find({});
    for (let i = 0; i < users.length; i++) {
      delete users[i]['_doc']["password"];
    }
    res.status(StatusCodes.OK).send({ data: users });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ data: { Error: err } });
  }
})

router.get('/api-per-user', async (req, res) => {
  try {
    const users = await Api.aggregate([
      {
        $group: {
          _id: '$uploadBy',
          count: { $sum: 1 } // this means that the count will increment by 1
        }
      }
    ]);
    res.status(StatusCodes.OK).send({ data: users });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ data: { Error: err } });
  }
})

router.get('/count', async (req, res) => {
  try {
    const users_count = await User.countDocuments();
    res.status(StatusCodes.OK).send({ data: users_count });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ data: { Error: err } });
  }
})

router.get('/search', async (req, res) => {
  try {
    let { q } = req.query;
    const users = await User.find({
      $or: [{ username: { $regex: q, $options: 'i' } }, { firstName: { $regex: q, $options: 'i' } }, { lastName: { $regex: q, $options: 'i' } }, { gender: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }, { userType: { $regex: q, $options: 'i' } }]
    });
    for (let i = 0; i < users.length; i++) {
      delete users[i]['_doc']["password"];
    }
    res.status(StatusCodes.OK).send({ data: users_count });
  } catch (err) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ data: { Error: err } });
    } 
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    delete user['_doc']["password"];
    res.status(StatusCodes.OK).send({ data: user });
  } catch (err) {
    if (err.name == "TypeError") {
      res.status(StatusCodes.BAD_REQUEST).send({ data: { Error: "API doesn't exist" } });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ data: { Error: err.message } });
    }
  }
  
})

router.post('/', async (req, res) => {
  let user = await User.find({ username: req.body.username })
  if (user.length != 0)
    res.send({ data: [], isSuccess: false, message: "Username already taken" });
  else {
    req.body.password = hash(req.body.password);
    req.body.birthday = Date.parse(req.body.birthday);
    const newUser = new User(req.body);
    await newUser.save();
    delete newUser['_doc']["password"];
    res.send({ data: newUser, isSuccess: true, message: "Success" });
  }
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: username });
  const loggedIn = (user && hash(password) == user.password);
  res.send({ data: { loggedIn: loggedIn, userType: loggedIn ? user.userType : 'CLIENT', username: user ? user.username : "", message: loggedIn ? "Success" : "Incorrect Username or Password" } });
})

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, req.body, { new: true });
  await user.save();
  delete user['_doc']["password"];
  res.send({ data: user });
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  await Bookmark.deleteMany({ userId: user._id });
  delete user['_doc']["password"];
  res.send({ data: user });
})

module.exports = router;