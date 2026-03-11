const express = require('express');
const { createNextcloudClient } = require('./nextcloudClient');

const router = express.Router();

router.get('/api/admin/tenants/:tenantId/users-usage', async (req, res) => {
  const { tenantId } = req.params;
  const collectedAt = new Date().toISOString();

  let client;
  try {
    client = createNextcloudClient();
  } catch (err) {
    return res.status(500).json({
      error: 'NEXTCLOUD_CONFIG_ERROR',
      message: err.message,
    });
  }

  const groupPrefix = process.env.NEXTCLOUD_TENANT_GROUP_PREFIX || '';
  const groupId = `${groupPrefix}${tenantId}`;

  try {
    console.log("groupId:", groupId);
    const users = await client.getGroupMembers(groupId);
    console.log("users from nextcloud:", users);
    const results = [];
    for (const userId of users) {
      try {
        const quotaInfo = await client.getUserQuota(userId);
        results.push({
          tenantId,
          userId: quotaInfo.userId,
          usedBytes: quotaInfo.usedBytes,
          quotaBytes: quotaInfo.quotaBytes,
          usagePercent: quotaInfo.usagePercent,
          lastCollectedAt: collectedAt,
        });
      } catch (userErr) {
        // 개별 사용자 실패는 로그만 남기고 건너뜀
        console.error('Failed to fetch quota for user', userId, userErr.message);
      }
    }

    return res.json({
      tenantId,
      users: results,
      lastCollectedAt: collectedAt,
    });
  } catch (err) {
    console.error('Failed to call Nextcloud OCS API', err.message);
    return res.status(502).json({
      error: 'NEXTCLOUD_API_ERROR',
      message: 'Failed to fetch data from Nextcloud',
      // 민감정보는 포함하지 않음
    });
  }
});

module.exports = router;

