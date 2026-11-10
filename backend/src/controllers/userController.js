const { userService } = require('../services');

async function listUsers(req, res, next) {
  try {
    const users = await userService.listOthers(req.user.id);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers };
