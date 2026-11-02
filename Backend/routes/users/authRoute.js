const router = require('express').Router();
const authController = require('../../controllers/users/authController');
const { authenticate, authorize } = require('../../middlewares/authenticate');
const { ALL_ROLES } = require('../../helpers/roles');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.post('/biometrics/enroll', authenticate, authorize(...ALL_ROLES), authController.enrollBiometric);
router.post('/biometrics/authenticate', authenticate, authorize(...ALL_ROLES), authController.authenticateBiometric);
router.post('/biometrics/session/verify', authenticate, authorize(...ALL_ROLES), authController.verifyBiometricSession);
router.post('/biometrics/revoke', authenticate, authorize(...ALL_ROLES), authController.revokeBiometric);

module.exports = router;
