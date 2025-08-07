const express= require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/routes', require('./routeManagement'));
router.use('/drivers',require('./driverRoutes'))
router.use('/conductor',require('./conductorRoutes'))
router.use('/bus',require('./busRoutes'))
router.use('/ticket',require('./tickets'))
router.use('/dashboard',require('./dashboardRoutes'))
router.use('/package',require('./packageRoutes'))
router.use('/tracking',require('./trackingRoutes'))
module.exports = router;