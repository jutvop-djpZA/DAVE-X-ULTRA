'use strict';

// Group metadata is cached in the LightweightStore SQLite DB.
// The cache is kept fresh by two live events:
//   • groups.update         — group property changes
//   • group-participants.update — admin promotions / demotions
//
// BUT if the bot was offline when those events fired, the cache is stale.
// We add a 4-hour TTL: any cache entry older than 4 hours is re-fetched
// from WhatsApp, so demotions/promotions made while the bot was offline
// are always picked up on the next group message.

const GROUP_META_TTL_SEC = 4 * 60 * 60; // 4 hours

async function isAdmin(sock, chatId, senderId) {
  try {
    const store = global.store;
    let participants;
    let needsFresh = false;

    // Check age of cached metadata
    if (store?.getGroupMetaAge) {
      const ageSeconds = store.getGroupMetaAge(chatId);
      needsFresh = ageSeconds > GROUP_META_TTL_SEC;
    }

    if (!needsFresh && store?.getGroupMeta) {
      const cached = store.getGroupMeta(chatId);
      if (cached?.participants?.length) {
        participants = cached.participants;
      } else {
        needsFresh = true;
      }
    } else {
      needsFresh = true;
    }

    if (needsFresh) {
      // Fetch live from WhatsApp and refresh the cache
      const meta = await sock.groupMetadata(chatId);
      if (store?.cacheGroupMeta) store.cacheGroupMeta(chatId, meta);
      participants = meta.participants;
    }

    const botId    = sock.user?.id || '';
    const ownerPhone = (global.ownerPhone || '').replace(/\D/g, '');
    const ownerLid   = (global.ownerLid   || '').replace(/\D/g, '');

    const findParticipant = (id) => {
      const idPhone = (id || '').split('@')[0].split(':')[0].split('.')[0];
      return participants.find(p => {
        const pPhone = p.id.split('@')[0].split(':')[0].split('.')[0];
        if (pPhone === idPhone) return true;
        if (ownerPhone && ownerLid) {
          if (idPhone === ownerPhone && pPhone === ownerLid) return true;
          if (idPhone === ownerLid   && pPhone === ownerPhone) return true;
        }
        if (p.lid) {
          const pLid = String(p.lid).split('@')[0].split(':')[0].split('.')[0];
          if (pLid === idPhone) return true;
        }
        return false;
      });
    };

    const participant = findParticipant(senderId);
    const bot         = findParticipant(botId);

    return {
      isSenderAdmin: !!(participant && (participant.admin === 'admin' || participant.admin === 'superadmin')),
      isBotAdmin:    !!(bot         && (bot.admin         === 'admin' || bot.admin         === 'superadmin')),
    };
  } catch {
    return { isSenderAdmin: false, isBotAdmin: false };
  }
}

module.exports = isAdmin;
