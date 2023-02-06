const express = require('express'),
  Bookmark = require('../Models/bookmark'),
  { StatusCodes } = require('http-status-codes');
  router = express.Router();

router.get('/', async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({}).populate('user').populate('api');
    res.status(StatusCodes.OK).send({ data: bookmarks });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ data: { Error: err } });
  }
})

router.get('/user/:userId', async (req, res) => {
  try {
    const {userId} = req.params;
    const bookmarks = await Bookmark.find({ user: userId }).populate('user').populate('api');
    res.status(StatusCodes.OK).send({ data: bookmarks });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ data: { Error: err } });
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bookmark = await Bookmark.findById(id).populate('user').populate('api');
    res.status(StatusCodes.OK).send({ data: bookmark })
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ data: { Error: err } });
  }
})

router.post('/', async (req, res) => {
  try {
    let userId = "6373b5a91876e3d4dac2201f";
    const currentBookmarks = await Bookmark.find({ user: userId, api: req.body.apiId });
    console.log(req.body)
    let bookmark;
    let created;
    if (currentBookmarks.length) {
      bookmark = await Bookmark.findByIdAndDelete(currentBookmarks[0]._id).populate('api').populate({
        path: 'api',
        populate: {
          path: 'category',
        }
      }).populate({
        path: 'api',
        populate: {
          path: 'uploadBy',
        }
      }).populate('user');
      created = false; 
    } else {
      bookmark = new Bookmark({
        api: req.body.apiId,
        user: userId,
      });
      await bookmark.save();
      bookmark = await Bookmark.find({ user: userId, api: req.body.apiId }).populate('api').populate('user').populate('api.category');
      created = true;
    }
    res.status( created ? StatusCodes.CREATED : StatusCodes.OK).send({ data: bookmark });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ data: { Error: err } });
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bookmark = await Bookmark.findByIdAndUpdate(id, req.body, { new: true });
    await bookmark.save();
    await bookmark.populate('api').populate('user').execPopulate();
    res.status(StatusCodes.OK).send({ data: bookmark });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ data: { Error: err } });
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bookmark = await Bookmark.findByIdAndDelete(id);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ data: { Error: err } });
  }
})

module.exports = router;