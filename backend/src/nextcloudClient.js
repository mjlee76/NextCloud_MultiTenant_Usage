//Nextcloud OCS API를 호출하는 클라이언트 모듈
const axios = require('axios');

function createNextcloudClient() {
  const baseURL = process.env.NEXTCLOUD_BASE_URL;
  const username = process.env.NEXTCLOUD_USERNAME;
  const appPassword = process.env.NEXTCLOUD_APP_PASSWORD;

  if (!baseURL || !username || !appPassword) {
    throw new Error('Missing NEXTCLOUD_BASE_URL / NEXTCLOUD_USERNAME / NEXTCLOUD_APP_PASSWORD environment variables');
  }

  const client = axios.create({
    baseURL,
    auth: {
      username,
      password: appPassword,
    },
    headers: {
      'OCS-APIREQUEST': 'true',
      Accept: 'application/json',
    },
  });

  async function getGroupMembers(groupId) {
    const res = await client.get(`/ocs/v1.php/cloud/groups/${encodeURIComponent(groupId)}`, {
      params: { format: 'json' },
    });

    console.log('group members raw response:', JSON.stringify(res.data, null, 2));

    const ocs = res.data.ocs;
    if (!ocs || !ocs.data || !ocs.data.users) {
      return [];
    }
    return ocs.data.users;
  }

  async function getUserQuota(userId) {
    const res = await client.get(`/ocs/v1.php/cloud/users/${encodeURIComponent(userId)}`, {
      params: { format: 'json' },
    });

    const userData = res.data.ocs && res.data.ocs.data;
    const quota = userData && userData.quota;

    if (!quota) {
      return {
        userId,
        usedBytes: 0,
        quotaBytes: null,
        usagePercent: null,
      };
    }

    const used = Number(quota.used ?? 0);
    // Nextcloud의 quota 필드: quota.quota (max), unlimited 시 -3일 수 있음
    const quotaBytes = Number(quota.quota ?? quota.total ?? 0);

    let usagePercent = null;
    if (quotaBytes > 0) {
      usagePercent = (used / quotaBytes) * 100;
    }

    return {
      userId,
      usedBytes: used,
      quotaBytes: quotaBytes > 0 ? quotaBytes : null,
      usagePercent,
    };
  }

  return {
    getGroupMembers,
    getUserQuota,
  };
}

module.exports = {
  createNextcloudClient,
};

