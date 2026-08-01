// ================================================================
// CODE.GS COMPLET FUSIONNÉ — remplace TOUT le contenu de code.gs
// ================================================================
// Ce script unique sert LES DEUX fronts :
//   - index.html (weekends-chez-alex) : réservation weekend GROUPE
//     → envoie un token (Script Property API_TOKEN à créer)
//   - app React solo (alexdhn1.github.io/solo) : réservation SOLO
//     → pas de token (protégée par validation + rate-limit)
//
// Installation :
// 1. Remplace tout le contenu de code.gs par ce fichier
//    (supprime les autres fichiers .gs du projet s'il y en a,
//    pour éviter les doublons de fonctions)
// 2. ⚙️ Paramètres du projet → Script Properties → Add :
//      API_TOKEN     = un secret long aléatoire
//      CANCEL_SECRET = un second secret long aléatoire (signature des liens
//                      d'annulation ; repli sur API_TOKEN si absent)
//    Reporte la valeur d'API_TOKEN dans common.js du repo weekends-chez-alex
//    (à la place de 'CHANGE_ME_TOKEN')
// 3. Lance setupLot1() une fois (réinstalle le trigger, sans doublon)
// 3bis. Lance setupReminders() une fois (trigger quotidien des rappels J-3
//    + création de la colonne « Rappel envoyé » sur Reservations et Solo)
// 4. Déployer → Gérer les déploiements → ✏️ Modifier →
//    Version « Nouvelle version » → Déployer
//    ⚠️ MODIFIER le déploiement existant, pas « Nouveau déploiement »
// ================================================================

// ============================================================
// CONFIGURATION GROUPE
// ============================================================
const CONFIG = {
  sheetName: 'Reservations',
  hostName:  'Alex',
  hostEmail: '', // laisse vide : récupéré automatiquement
  maxLen: { nom: 100, email: 254, message: 1000 },
};

// URL /exec du déploiement PUBLIC (accès « Tout le monde »), utilisée pour
// construire les liens d'annulation envoyés par mail.
// ⚠️ Figée volontairement : ScriptApp.getService().getUrl() renvoie l'URL du
// déploiement courant, or ce script en compte plusieurs — dont un @HEAD qui
// exige une connexion Google. Un invité cliquant le lien tomberait alors sur
// un écran de login. Si tu recrées un déploiement, mets cette valeur à jour.
const WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbyKDmf63_7GZ1abR4-0whXz1ZvYYiSYckTgXCFKYgGuBAlhuZu21iKVGSCqXMZKUc8/exec';

// ============================================================
// AUTH — token partagé avec index.html (Script Property API_TOKEN)
// ============================================================
function checkToken(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  return !!expected && token === expected;
}

// ============================================================
// API JSON — Point d'entrée GET
// ============================================================
function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;

    // Annulation depuis un lien signé reçu par mail → page HTML (pas du JSON)
    if (action === 'cancel') {
      return handleCancelRequest(e.parameter || {});
    }

    // Action SOLO : pas de token (le front React n'en envoie pas)
    if (action === 'getSoloWeekends') {
      return jsonResponse(getSoloWeekends());
    }

    // Actions GROUPE : token obligatoire
    if (action === 'getWeekends') {
      if (!checkToken(e.parameter && e.parameter.token)) {
        return jsonResponse({ error: 'unauthorized' });
      }
      return jsonResponse(getAvailableWeekends());
    }

    return jsonResponse({ status: 'ok', message: 'API Weekend réservation' });
  } catch (err) {
    console.error('doGet error: ' + err);
    return jsonResponse({ error: 'server_error' });
  }
}

// ============================================================
// API JSON — Point d'entrée POST
// ============================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');

    // Réservation SOLO : pas de token (validation + rate-limit dédiés)
    if (data.action === 'soloReservation') {
      return jsonResponse(submitSoloReservation(data));
    }

    // Réservation GROUPE : token obligatoire
    if (!checkToken(data.token)) {
      return jsonResponse({ success: false, message: 'Non autorisé.' });
    }
    return jsonResponse(submitReservation(data));
  } catch (err) {
    // Ne JAMAIS renvoyer err.toString() au client (fuite d'info interne)
    console.error('doPost error: ' + err);
    return jsonResponse({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Une erreur est survenue côté serveur. Réessaie dans un instant.',
    });
  }
}

// ============================================================
// UTILITAIRE — réponse JSON
// ============================================================
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// HELPERS PARTAGÉS — sécurité & validation
// ============================================================

/**
 * Protection contre l'injection de formule dans Sheets.
 * Préfixe la valeur d'une apostrophe si elle commence par = + - @
 * (ou tab/CR utilisés pour contourner le filtre).
 * À utiliser AVANT chaque setValue() de donnée saisie par un utilisateur.
 */
function sanitizeCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str === '') return '';
  if (/^[=+\-@\t\r]/.test(str)) return "'" + str;
  return str;
}

/** Coupe une chaîne à maxLen caractères et supprime les espaces de bord. */
function truncate(value, maxLen) {
  const str = value === null || value === undefined ? '' : String(value);
  const trimmed = str.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

function isValidEmail(email) {
  if (!email || email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}

/** true si les deux intervalles [aStart,aEnd] et [bStart,bEnd] se chevauchent. */
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return !(aEnd < bStart || aStart > bEnd);
}

// ============================================================
// LECTURE GROUPE — weekends disponibles (filtre dates passées)
// ============================================================
function getAvailableWeekends() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const dispo = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === 'Disponible' && !isPastSlot(data[i][2])) {
      dispo.push({
        rowIndex: i + 1,
        label:    String(data[i][0]),
      });
    }
  }
  return dispo;
}

// ============================================================
// RÉSERVATION GROUPE — validations serveur + LockService +
// label stable (STALE_SLOT) + blocage solo (PATCH B6) +
// Sheets + Calendar + Email
// ============================================================
function submitReservation(formData) {
  // -- Validations serveur (ne jamais faire confiance au front) --
  const rowIndex = parseInt(formData.rowIndex, 10);
  if (!rowIndex || isNaN(rowIndex) || rowIndex < 2) {
    return { success: false, code: 'INVALID_INPUT', message: 'Créneau invalide. Recharge la page.' };
  }
  const labelSent = String(formData.label === null || formData.label === undefined ? '' : formData.label).trim();
  if (!labelSent) {
    return { success: false, code: 'INVALID_INPUT', message: 'Créneau invalide. Recharge la page.' };
  }
  const nom = truncate(formData.nom, CONFIG.maxLen.nom);
  if (!nom || String(formData.nom).trim().length > CONFIG.maxLen.nom) {
    return { success: false, code: 'INVALID_INPUT', message: 'Nom invalide (max ' + CONFIG.maxLen.nom + ' caractères).' };
  }
  const nbPersonnes = parseInt(formData.nbPersonnes, 10);
  if (!nbPersonnes || isNaN(nbPersonnes) || nbPersonnes < 1 || nbPersonnes > 10) {
    return { success: false, code: 'INVALID_INPUT', message: 'Le nombre de personnes doit être entre 1 et 10.' };
  }
  const email = truncate(formData.email, CONFIG.maxLen.email);
  if (!isValidEmail(email)) {
    return { success: false, code: 'INVALID_INPUT', message: 'Adresse email invalide.' };
  }
  const rawMessage = formData.message === null || formData.message === undefined ? '' : String(formData.message).trim();
  if (rawMessage.length > CONFIG.maxLen.message) {
    return { success: false, code: 'INVALID_INPUT', message: 'Message trop long (max ' + CONFIG.maxLen.message + ' caractères).' };
  }
  const message = rawMessage;

  // -- Section critique : un seul écrivain à la fois --
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    console.error('LockService : verrou non obtenu — ' + e);
    return { success: false, message: 'Le serveur est occupé, réessaie dans quelques secondes.' };
  }

  let label, dateDebut, dateFin;
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
    if (!sheet) {
      console.error('Feuillet Reservations introuvable');
      return { success: false, code: 'STALE_SLOT', message: 'Ce créneau a changé, recharge la page.' };
    }
    if (rowIndex > sheet.getLastRow()) {
      return { success: false, code: 'STALE_SLOT', message: 'Ce créneau a changé, recharge la page.' };
    }

    const row = sheet.getRange(rowIndex, 1, 1, 8).getValues()[0];
    label = String(row[0]);

    // -- ID stable : le label envoyé doit correspondre à la ligne
    // (les lignes se décalent quand archivePastRows() supprime des lignes)
    if (label.trim() !== labelSent) {
      return { success: false, code: 'STALE_SLOT', message: 'Ce créneau a changé, recharge la page.' };
    }

    // -- Anti double-booking
    if (row[3] !== 'Disponible') {
      return { success: false, code: 'ALREADY_BOOKED', message: "Désolé, ce weekend vient d'être réservé ! Choisis une autre date." };
    }

    dateDebut = new Date(row[1]);
    dateFin   = new Date(row[2]);

    // -- Créneau passé
    if (isPastSlot(dateFin)) {
      return { success: false, code: 'PAST_SLOT', message: 'Ce weekend est déjà passé. Choisis une autre date !' };
    }

    // --- PATCH B6 : refuser si un weekend solo est déjà réservé sur ces dates
    const conflit = hasSoloConflict(dateDebut, dateFin);
    if (conflit) {
      return {
        success: false,
        code: 'CONFLICT_GROUP',
        message: 'Ce weekend chevauche un séjour déjà réservé. Choisis une autre date !',
      };
    }

    // -- Écriture (toute donnée utilisateur passe par sanitizeCell)
    sheet.getRange(rowIndex, 4).setValue('Réservé');
    sheet.getRange(rowIndex, 5).setValue(sanitizeCell(nom));
    sheet.getRange(rowIndex, 6).setValue(sanitizeCell(email));
    sheet.getRange(rowIndex, 7).setValue(sanitizeCell(message));
    sheet.getRange(rowIndex, 8).setValue(new Date());
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  const eventTitle = '🏠 ' + nom + ' — Weekend (' + nbPersonnes + ' pers.)';
  const eventDescription =
    '👤 Invité   : ' + nom         + '\n' +
    '👥 Nb pers. : ' + nbPersonnes + '\n' +
    '📧 Email    : ' + email       + '\n' +
    '💬 Message  : ' + message;

  // -- Google Calendar : invitation native à l'invité --
  // (hors section critique, échec non bloquant)
  createBookingEvent({
    title: eventTitle,
    dateDebut: dateDebut,
    dateFin: dateFin,
    description: eventDescription,
    guestEmail: email,
  });

  // -- Email de confirmation (échec non bloquant, message adapté) --
  const cancelUrl = buildCancelUrl('groupe', rowIndex, email);
  let mailSent = true;
  try {
    const hostEmail = CONFIG.hostEmail || Session.getActiveUser().getEmail();
    const ics = buildIcsAttachment({
      uidSeed: 'groupe-' + rowIndex + '-' + email,
      title: eventTitle,
      dateDebut: dateDebut,
      dateFin: dateFin,
      description: 'Weekend chez ' + CONFIG.hostName + ' — ' + label,
    });
    const mail = {
      to:      email,
      replyTo: hostEmail,
      subject: '✅ Réservation confirmée — ' + label,
      body:
        'Bonjour ' + nom + ' !\n\n' +
        'Ta réservation est confirmée pour le weekend du ' + label +
        ' pour ' + nbPersonnes + ' personne(s).\n\n' +
        (message ? 'Ton message : « ' + message + ' »\n\n' : '') +
        'Au programme : ripaille, châteaux, vins de Touraine, zoo de Beauval ' +
        'et si l\'ambiance est là… système son digne d\'Ibiza 🎶\n\n' +
        infosPratiquesTexte() + '\n' +
        cancelBlocTexte(cancelUrl) +
        'À très bientôt à St-Georges-sur-Cher !\n' +
        CONFIG.hostName
    };
    if (ics) {
      mail.attachments = [ics];
    }
    MailApp.sendEmail(mail);
  } catch (e) {
    console.error('Erreur email : ' + e);
    mailSent = false;
  }

  // -- Notification au propriétaire (échec non bloquant) --
  notifyOwnerNewBooking({
    type: 'groupe',
    label: label,
    nom: nom,
    email: email,
    message: message,
    nbPersonnes: nbPersonnes,
    joursChoisis: '',
    rowIndex: rowIndex,
  });

  return {
    success: true,
    message: mailSent
      ? 'Réservation confirmée pour le ' + label + ' 🎉 Un email de confirmation t\'a été envoyé !'
      : 'Réservation confirmée pour le ' + label + ' 🎉 En revanche, l\'email de confirmation n\'a pas pu partir — note bien la date !',
  };
}

// ============================================================
// CONFIG SOLO
// ============================================================
const SOLO_CONFIG = {
  sheetName: 'Solo',
  reservationsSheetName: 'Reservations',
  hostName: 'Alex',
  // Colonnes du feuillet Solo (1-indexé)
  col: {
    label: 1,
    dateDebut: 2,
    dateFin: 3,
    statut: 4,
    nom: 5,
    email: 6,
    message: 7,
    jours: 8,
    dateResa: 9,
  },
  maxLen: { nom: 100, email: 254, message: 1000, jours: 60 },
  // Anti-abus : 3 requêtes par tranche de 10 minutes et par email
  rateLimit: { maxRequests: 3, windowSeconds: 600 },
};

// Enum des valeurs acceptées pour joursChoisis.
// ⚠️ Doit rester synchronisé avec JOURS_OPTIONS du front
// (solo/src/features/solo-booking/content.ts).
const SOLO_JOURS_OPTIONS = [
  'Vendredi → Dimanche',
  'Vendredi → Lundi (+ 1 jour TT)',
  'Vendredi → Mardi (+ 2 jours TT)',
  'Samedi → Dimanche',
  'Samedi → Lundi (+ TT lundi)',
  'Samedi → Mardi (+ TT lun-mar)',
];

/** Réponse d'erreur normalisée conforme au contrat d'API. */
function soloError(code, message) {
  return { success: false, code: code, message: message };
}

/**
 * Valide et normalise le payload de réservation solo.
 * Retourne { ok:true, value:{...} } ou { ok:false, error:{...} }.
 */
function validateSoloPayload(formData) {
  const data = formData || {};

  const rowIndex = parseInt(data.rowIndex, 10);
  if (!rowIndex || isNaN(rowIndex) || rowIndex < 2) {
    return { ok: false, error: soloError('INVALID_INPUT', 'Créneau invalide. Recharge la page.') };
  }

  const label = String(data.label === null || data.label === undefined ? '' : data.label).trim();
  if (!label) {
    return { ok: false, error: soloError('INVALID_INPUT', 'Créneau invalide. Recharge la page.') };
  }

  const nom = truncate(data.nom, SOLO_CONFIG.maxLen.nom);
  if (!nom) {
    return { ok: false, error: soloError('INVALID_INPUT', 'Merci d\'indiquer ton prénom.') };
  }
  if (String(data.nom).trim().length > SOLO_CONFIG.maxLen.nom) {
    return { ok: false, error: soloError('INVALID_INPUT', 'Le nom est trop long (' + SOLO_CONFIG.maxLen.nom + ' caractères max).') };
  }

  const email = truncate(data.email, SOLO_CONFIG.maxLen.email);
  if (!email || String(data.email).trim().length > SOLO_CONFIG.maxLen.email || !isValidEmail(email)) {
    return { ok: false, error: soloError('INVALID_INPUT', 'Adresse email invalide.') };
  }

  const rawMessage = data.message === null || data.message === undefined ? '' : String(data.message).trim();
  if (rawMessage.length > SOLO_CONFIG.maxLen.message) {
    return { ok: false, error: soloError('INVALID_INPUT', 'Le message est trop long (' + SOLO_CONFIG.maxLen.message + ' caractères max).') };
  }
  const message = truncate(rawMessage, SOLO_CONFIG.maxLen.message);

  const jours = data.joursChoisis === null || data.joursChoisis === undefined ? '' : String(data.joursChoisis).trim();
  if (jours && SOLO_JOURS_OPTIONS.indexOf(jours) === -1) {
    return { ok: false, error: soloError('INVALID_INPUT', 'Option de séjour inconnue. Recharge la page.') };
  }

  return {
    ok: true,
    value: { rowIndex: rowIndex, label: label, nom: nom, email: email, message: message, joursChoisis: jours },
  };
}

/**
 * Rate-limit simple par email : maxRequests par fenêtre de windowSeconds.
 * CacheService est best-effort : garde-fou anti-abus, pas une garantie forte.
 */
function checkSoloRateLimit(email) {
  try {
    const cache = CacheService.getScriptCache();
    const key = 'solo_rl_' + Utilities.base64EncodeWebSafe(String(email).toLowerCase());
    const raw = cache.get(key);
    const count = raw ? parseInt(raw, 10) || 0 : 0;
    if (count >= SOLO_CONFIG.rateLimit.maxRequests) return false;
    cache.put(key, String(count + 1), SOLO_CONFIG.rateLimit.windowSeconds);
    return true;
  } catch (e) {
    console.error('Rate-limit cache indisponible : ' + e);
    return true;
  }
}

/**
 * Périodes occupées par les weekends GROUPE (statut « Réservé »),
 * élargies d'un jour de chaque côté (le groupe occupe la maison).
 */
function getGroupBusyRanges() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reservationsSheet = ss.getSheetByName(SOLO_CONFIG.reservationsSheetName);
  if (!reservationsSheet) return [];

  const reservationsData = reservationsSheet.getDataRange().getValues();
  const busyDates = [];

  for (let i = 1; i < reservationsData.length; i++) {
    if (reservationsData[i][3] !== 'Réservé') continue;
    if (!reservationsData[i][1] || !reservationsData[i][2]) continue;

    const margeDebut = new Date(reservationsData[i][1]);
    margeDebut.setDate(margeDebut.getDate() - 1);
    const margeFin = new Date(reservationsData[i][2]);
    margeFin.setDate(margeFin.getDate() + 1);

    busyDates.push({ start: margeDebut, end: margeFin });
  }

  return busyDates;
}

/** true si le créneau solo [debut, fin] chevauche une période groupe occupée. */
function hasGroupConflict(soloDebut, soloFin, busyRanges) {
  const ranges = busyRanges || getGroupBusyRanges();
  for (let k = 0; k < ranges.length; k++) {
    if (rangesOverlap(soloDebut, soloFin, ranges[k].start, ranges[k].end)) return true;
  }
  return false;
}

// ============================================================
// LECTURE SOLO — créneaux disponibles
// ============================================================
function getSoloWeekends() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const busyDates = getGroupBusyRanges();

  const soloSheet = ss.getSheetByName(SOLO_CONFIG.sheetName);
  if (!soloSheet) return [];

  const soloData = soloSheet.getDataRange().getValues();
  const dispo = [];

  for (let j = 1; j < soloData.length; j++) {
    if (soloData[j][3] !== 'Disponible') continue;
    if (!soloData[j][1] || !soloData[j][2]) continue;

    const soloDebut = new Date(soloData[j][1]);
    const soloFin = new Date(soloData[j][2]);

    if (isPastSlot(soloFin)) continue;
    if (hasGroupConflict(soloDebut, soloFin, busyDates)) continue;

    dispo.push({
      rowIndex: j + 1,
      label: soloData[j][0],
      dateDebut: soloData[j][1],
      dateFin: soloData[j][2],
    });
  }

  return dispo;
}

// ============================================================
// RÉSERVATION SOLO — verrou, validation, anti double-booking
// ============================================================
function submitSoloReservation(formData) {
  // 1) Validation d'entrée (avant de prendre le verrou)
  const validation = validateSoloPayload(formData);
  if (!validation.ok) return validation.error;
  const input = validation.value;

  // 2) Rate-limit anti-abus mail
  if (!checkSoloRateLimit(input.email)) {
    return soloError('INVALID_INPUT', 'Trop de tentatives avec cet email. Réessaie dans une dizaine de minutes.');
  }

  // 3) Section critique
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    console.error('LockService : verrou non obtenu — ' + e);
    return soloError('CONFLICT_GROUP', 'Le serveur est occupé, réessaie dans quelques secondes.');
  }

  let label, soloDebut, soloFin;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SOLO_CONFIG.sheetName);
    if (!sheet) {
      console.error('Feuillet Solo introuvable');
      return soloError('STALE_SLOT', 'Ce créneau a changé, recharge la page.');
    }

    if (input.rowIndex > sheet.getLastRow()) {
      return soloError('STALE_SLOT', 'Ce créneau a changé, recharge la page.');
    }

    const row = sheet.getRange(input.rowIndex, 1, 1, SOLO_CONFIG.col.dateResa).getValues()[0];
    label = String(row[SOLO_CONFIG.col.label - 1]);

    // ID stable : le label envoyé par le front doit correspondre à la ligne
    if (label.trim() !== input.label) {
      return soloError('STALE_SLOT', 'Ce créneau a changé, recharge la page.');
    }

    if (row[SOLO_CONFIG.col.statut - 1] !== 'Disponible') {
      return soloError('ALREADY_BOOKED', "Désolé, ce créneau vient d'être pris ! Choisis une autre date.");
    }

    soloDebut = new Date(row[SOLO_CONFIG.col.dateDebut - 1]);
    soloFin = new Date(row[SOLO_CONFIG.col.dateFin - 1]);

    if (isPastSlot(soloFin)) {
      return soloError('PAST_SLOT', 'Ce créneau est déjà passé. Choisis une autre date !');
    }

    if (hasGroupConflict(soloDebut, soloFin)) {
      return soloError('CONFLICT_GROUP', 'Ce créneau chevauche un weekend groupe. Choisis une autre date !');
    }

    // Écriture — toute donnée utilisateur passe par sanitizeCell()
    sheet.getRange(input.rowIndex, SOLO_CONFIG.col.statut).setValue('Réservé');
    sheet.getRange(input.rowIndex, SOLO_CONFIG.col.nom).setValue(sanitizeCell(input.nom));
    sheet.getRange(input.rowIndex, SOLO_CONFIG.col.email).setValue(sanitizeCell(input.email));
    sheet.getRange(input.rowIndex, SOLO_CONFIG.col.message).setValue(sanitizeCell(input.message));
    sheet.getRange(input.rowIndex, SOLO_CONFIG.col.jours).setValue(sanitizeCell(input.joursChoisis));
    sheet.getRange(input.rowIndex, SOLO_CONFIG.col.dateResa).setValue(new Date());
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  // 4) Agenda — invitation native à l'invité (échec non bloquant)
  createBookingEvent({
    title: '🌿 ' + input.nom + ' — Séjour solo',
    dateDebut: soloDebut,
    dateFin: soloFin,
    description:
      '👤 Invité   : ' + input.nom + '\n' +
      '📧 Email    : ' + input.email + '\n' +
      '🗓️ Jours    : ' + (input.joursChoisis || '(non précisé)') + '\n' +
      '💬 Message  : ' + input.message,
    guestEmail: input.email,
  });

  // 5) Email de confirmation — hors section critique, échec non bloquant
  const mailSent = sendSoloConfirmationEmail(input, label, soloDebut, soloFin);

  // 6) Notification au propriétaire (échec non bloquant)
  notifyOwnerNewBooking({
    type: 'solo',
    label: label,
    nom: input.nom,
    email: input.email,
    message: input.message,
    nbPersonnes: '',
    joursChoisis: input.joursChoisis,
    rowIndex: input.rowIndex,
  });

  return {
    success: true,
    message: mailSent
      ? 'C\'est confirmé pour le ' + label + ' en solo 🎉 Un email de confirmation t\'a été envoyé !'
      : 'C\'est confirmé pour le ' + label + ' en solo 🎉 En revanche, l\'email de confirmation n\'a pas pu partir — note bien la date !',
  };
}

/** Envoie l'email de confirmation solo. Retourne true si envoyé. */
function sendSoloConfirmationEmail(input, label, dateDebut, dateFin) {
  try {
    const cancelUrl = buildCancelUrl('solo', input.rowIndex, input.email);
    const mail = {
      to: input.email,
      subject: '✅ Weekend solo confirmé — ' + label,
      body:
        'Salut ' + input.nom + ' !\n\n' +
        'C\'est confirmé pour le ' + label + ' en mode solo/tête-à-tête.\n' +
        (input.joursChoisis ? 'Jours choisis : ' + input.joursChoisis + '\n' : '') +
        (input.message ? 'Ton message : « ' + input.message + ' »\n' : '') +
        '\n' + infosPratiquesTexte() + '\n' +
        cancelBlocTexte(cancelUrl) +
        'À très bientôt à St-Georges-sur-Cher !\n' +
        SOLO_CONFIG.hostName,
    };

    if (dateDebut && dateFin) {
      const ics = buildIcsAttachment({
        uidSeed: 'solo-' + input.rowIndex + '-' + input.email,
        title: 'Séjour solo chez ' + SOLO_CONFIG.hostName,
        dateDebut: dateDebut,
        dateFin: dateFin,
        description: 'Séjour solo — ' + label +
          (input.joursChoisis ? ' (' + input.joursChoisis + ')' : ''),
      });
      if (ics) mail.attachments = [ics];
    }

    MailApp.sendEmail(mail);
    return true;
  } catch (e) {
    console.error('Erreur email solo : ' + e);
    return false;
  }
}

/**
 * PATCH B6 — Retourne le label du premier créneau solo RÉSERVÉ qui
 * chevauche la période groupe [dateDebut, dateFin] (marge d'un jour
 * de chaque côté, cohérente avec getGroupBusyRanges), ou null.
 * Appelé par submitReservation() (groupe).
 */
function hasSoloConflict(dateDebut, dateFin) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const soloSheet = ss.getSheetByName(SOLO_CONFIG.sheetName);
  if (!soloSheet) return null;

  const margeDebut = new Date(dateDebut);
  margeDebut.setDate(margeDebut.getDate() - 1);
  const margeFin = new Date(dateFin);
  margeFin.setDate(margeFin.getDate() + 1);

  const soloData = soloSheet.getDataRange().getValues();
  for (let i = 1; i < soloData.length; i++) {
    if (soloData[i][SOLO_CONFIG.col.statut - 1] !== 'Réservé') continue;
    if (!soloData[i][1] || !soloData[i][2]) continue;

    const soloDebut = new Date(soloData[i][SOLO_CONFIG.col.dateDebut - 1]);
    const soloFin = new Date(soloData[i][SOLO_CONFIG.col.dateFin - 1]);

    if (rangesOverlap(soloDebut, soloFin, margeDebut, margeFin)) {
      return String(soloData[i][SOLO_CONFIG.col.label - 1]);
    }
  }
  return null;
}

// ============================================================
// LOT 1 — FILTRE DES DATES PASSÉES + ARCHIVAGE AUTO
// ============================================================
// Pour chaque feuillet :
//  - dateFinCol     : colonne de la DATE DE FIN (A=1, B=2, C=3...)
//  - dateFinHeaders : libellés d'en-tête acceptés pour CETTE colonne.
//    Si l'en-tête réel n'est pas dans la liste, le feuillet est IGNORÉ
//    (log + abort) : on ne supprime jamais sur une colonne incertaine.
const LOT1_CONFIG = {
  archiveSheetName: 'Archive',
  sheets: [
    { name: 'Reservations', dateFinCol: 3, dateFinHeaders: ['Date fin', 'Date de fin', 'Fin'] },
    { name: 'Solo',         dateFinCol: 3, dateFinHeaders: ['Date fin', 'Date de fin', 'Fin'] },
  ],
};

/** Un créneau est "passé" si sa date de fin est avant aujourd'hui. */
function isPastSlot(dateFin) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fin = new Date(dateFin);
  fin.setHours(0, 0, 0, 0);
  return fin < today;
}

/**
 * GARDE-FOU — l'en-tête de la colonne date de fin doit correspondre
 * à ce qu'on attend AVANT d'autoriser la moindre suppression.
 */
function canArchiveSheet(sheet, cfg) {
  const lastCol = sheet.getLastColumn();
  if (cfg.dateFinCol > lastCol) {
    Logger.log('ARCHIVAGE ABORTÉ [' + cfg.name + '] : colonne ' + cfg.dateFinCol + ' hors du feuillet (' + lastCol + ' colonnes).');
    return false;
  }

  const header = String(sheet.getRange(1, cfg.dateFinCol).getValue()).trim();
  const expected = cfg.dateFinHeaders || [];
  const matches = expected.some(function (name) {
    return name.toLowerCase() === header.toLowerCase();
  });

  if (!matches) {
    Logger.log(
      'ARCHIVAGE ABORTÉ [' + cfg.name + '] : en-tête colonne ' + cfg.dateFinCol +
      ' = "' + header + '", attendu l\'un de [' + expected.join(', ') + ']. ' +
      'Corrige LOT1_CONFIG ou la Sheet avant de relancer.'
    );
    return false;
  }

  return true;
}

/** Déplace les lignes passées vers l'onglet Archive (trigger quotidien). */
function archivePastRows() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let archive = ss.getSheetByName(LOT1_CONFIG.archiveSheetName);
  if (!archive) {
    archive = ss.insertSheet(LOT1_CONFIG.archiveSheetName);
    archive.appendRow(['Feuillet source', 'Archivé le', '→ données de la ligne originale']);
  }

  LOT1_CONFIG.sheets.forEach(function (cfg) {
    const sheet = ss.getSheetByName(cfg.name);
    if (!sheet) return;

    // Garde-fou : jamais de suppression si la colonne n'est pas celle attendue
    if (!canArchiveSheet(sheet, cfg)) return;

    const data = sheet.getDataRange().getValues();
    const rowsToDelete = [];

    for (let i = 1; i < data.length; i++) {
      const dateFin = data[i][cfg.dateFinCol - 1];
      if (!dateFin) continue;
      if (!isPastSlot(dateFin)) continue;

      archive.appendRow([cfg.name, new Date()].concat(data[i]));
      rowsToDelete.push(i + 1);
    }

    // Supprimer de bas en haut pour ne pas décaler les index
    for (let d = rowsToDelete.length - 1; d >= 0; d--) {
      sheet.deleteRow(rowsToDelete[d]);
    }

    if (rowsToDelete.length > 0) {
      Logger.log('Archivage [' + cfg.name + '] : ' + rowsToDelete.length + ' ligne(s) déplacée(s).');
    }
  });
}

/** À lancer UNE FOIS : (ré)installe le trigger quotidien (4h) + premier passage. */
function setupLot1() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'archivePastRows') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('archivePastRows')
    .timeBased()
    .everyDays(1)
    .atHour(4)
    .create();

  archivePastRows();
  Logger.log('Lot 1 installé : trigger quotidien à 4h + premier archivage effectué.');
}

// ============================================================
// INITIALISATION — fonctions one-shot (inchangées)
// ============================================================
function initSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.sheetName);
  } else {
    const ui  = SpreadsheetApp.getUi();
    const rep = ui.alert(
      '⚠️ Attention',
      'La sheet "' + CONFIG.sheetName + '" existe déjà. Réinitialiser ?',
      ui.ButtonSet.YES_NO
    );
    if (rep !== ui.Button.YES) return;
    sheet.clearContents();
  }

  const headers = ['Weekend', 'Date début', 'Date fin', 'Statut', 'Nom', 'Email', 'Message', 'Date réservation'];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4a4a4a');
  headerRange.setFontColor('#ffffff');

  const weekends = generateWeekends(new Date(2026, 2, 28), new Date(2026, 11, 31));
  const rows = weekends.map(function (w) {
    return [w.label, w.dateDebut, w.dateFin, 'Disponible', '', '', '', ''];
  });
  sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  sheet.getRange(2, 2, rows.length, 2).setNumberFormat('dd/mm/yyyy');

  const statutRange = sheet.getRange(2, 4, rows.length, 1);
  const rule1 = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Disponible').setBackground('#d9ead3').setFontColor('#274e13').setRanges([statutRange]).build();
  const rule2 = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Réservé').setBackground('#f4cccc').setFontColor('#990000').setRanges([statutRange]).build();
  sheet.setConditionalFormatRules([rule1, rule2]);
  sheet.autoResizeColumns(1, 8);

  SpreadsheetApp.getUi().alert('✅ Sheet initialisée avec ' + rows.length + ' weekends !');
}

function generateWeekends(startSamedi, endDate) {
  const mois     = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
  const weekends = [];
  const current  = new Date(startSamedi);

  while (current <= endDate) {
    const samedi   = new Date(current);
    const dimanche = new Date(current);
    dimanche.setDate(dimanche.getDate() + 1);

    let label;
    if (samedi.getMonth() === dimanche.getMonth()) {
      label = samedi.getDate() + '-' + dimanche.getDate() + ' ' + mois[samedi.getMonth()] + ' ' + samedi.getFullYear();
    } else {
      label = samedi.getDate() + ' ' + mois[samedi.getMonth()] + ' - ' + dimanche.getDate() + ' ' + mois[dimanche.getMonth()] + ' ' + samedi.getFullYear();
    }

    weekends.push({ label: label, dateDebut: samedi, dateFin: dimanche });
    current.setDate(current.getDate() + 14);
  }
  return weekends;
}

function initSoloSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SOLO_CONFIG.sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(SOLO_CONFIG.sheetName);
  } else {
    const ui = SpreadsheetApp.getUi();
    const rep = ui.alert(
      '⚠️ Attention',
      'Le feuillet "' + SOLO_CONFIG.sheetName + '" existe déjà. Réinitialiser ?',
      ui.ButtonSet.YES_NO
    );
    if (rep !== ui.Button.YES) return;
    sheet.clearContents();
  }

  const headers = ['Créneau', 'Date début', 'Date fin', 'Statut', 'Nom', 'Email', 'Message', 'Jours choisis', 'Date réservation'];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#2d4a3e');
  headerRange.setFontColor('#ffffff');

  const weekends = generateSoloWeekends(new Date(2026, 3, 17), new Date(2026, 11, 31));
  const rows = weekends.map(function (w) {
    return [w.label, w.dateDebut, w.dateFin, 'Disponible', '', '', '', '', ''];
  });

  sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  sheet.getRange(2, 2, rows.length, 2).setNumberFormat('dd/mm/yyyy');

  const statutRange = sheet.getRange(2, 4, rows.length, 1);
  const rule1 = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Disponible').setBackground('#d9ead3').setFontColor('#274e13').setRanges([statutRange]).build();
  const rule2 = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Réservé').setBackground('#f4cccc').setFontColor('#990000').setRanges([statutRange]).build();
  sheet.setConditionalFormatRules(sheet.getConditionalFormatRules().concat([rule1, rule2]));
  sheet.autoResizeColumns(1, 9);

  SpreadsheetApp.getUi().alert('✅ Feuillet Solo initialisé avec ' + rows.length + ' créneaux !');
}

function generateSoloWeekends(startDate, endDate) {
  const mois = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
  const weekends = [];

  const current = new Date(startDate);
  while (current.getDay() !== 5) { // 5 = vendredi
    current.setDate(current.getDate() + 1);
  }

  while (current <= endDate) {
    const vendredi = new Date(current);
    const mardi = new Date(current);
    mardi.setDate(mardi.getDate() + 4);

    let label;
    if (vendredi.getMonth() === mardi.getMonth()) {
      label = vendredi.getDate() + '-' + mardi.getDate() + ' ' + mois[vendredi.getMonth()] + ' ' + vendredi.getFullYear();
    } else {
      label = vendredi.getDate() + ' ' + mois[vendredi.getMonth()] + ' - ' + mardi.getDate() + ' ' + mois[mardi.getMonth()] + ' ' + vendredi.getFullYear();
    }
    label = label + ' (ven→mar)';

    weekends.push({ label: label, dateDebut: vendredi, dateFin: mardi });
    current.setDate(current.getDate() + 7);
  }
  return weekends;
}

// ============================================================
// VAGUE 2 — CONFIGURATION COMMUNE
// ============================================================
// ⚠️ Aucune coordonnée GPS n'est stockée ici : uniquement des liens
// cartographiques par recherche d'adresse (fonctionnent partout).
const V2_CONFIG = {
  adresse: '9 rue des Vendanges, 41400 Saint-Georges-sur-Cher',
  mapsGoogle: 'https://www.google.com/maps/search/?api=1&query=9+rue+des+Vendanges+41400+Saint-Georges-sur-Cher',
  mapsApple:  'https://maps.apple.com/?q=9+rue+des+Vendanges+41400+Saint-Georges-sur-Cher',
  mapsWaze:   'https://waze.com/ul?q=9%20rue%20des%20Vendanges%2041400%20Saint-Georges-sur-Cher',
  trajet: 'À ~2h de Paris en voiture ; gare de Saint-Georges-sur-Cher desservie depuis Tours.',
  // En-tête de la colonne anti-doublon des rappels (A5)
  reminderHeader: 'Rappel envoyé',
  // Nombre de jours avant l'arrivée pour l'envoi du rappel
  reminderDaysBefore: 3,
};

/**
 * A2 — Bloc « infos pratiques » unique, réutilisé par tous les mails
 * (confirmation groupe, confirmation solo, rappel J-3).
 */
function infosPratiquesTexte() {
  return [
    '— Infos pratiques —',
    'Adresse : ' + V2_CONFIG.adresse,
    'Google Maps : ' + V2_CONFIG.mapsGoogle,
    'Apple Plans : ' + V2_CONFIG.mapsApple,
    'Waze : ' + V2_CONFIG.mapsWaze,
    V2_CONFIG.trajet,
    '',
  ].join('\n');
}

/** Bloc « annuler » ajouté en bas des mails (vide si l'URL est indisponible). */
function cancelBlocTexte(cancelUrl) {
  if (!cancelUrl) return '';
  return 'Un empêchement ? Tu peux libérer le créneau en un clic :\n' + cancelUrl + '\n\n';
}

// ============================================================
// A1 — Événement Calendar avec invitation native
// ============================================================
/**
 * Crée l'événement journée entière et invite l'email fourni.
 * Best-effort : toute erreur est loggée, jamais propagée.
 * @return {string|null} l'id de l'événement, ou null en cas d'échec.
 */
function createBookingEvent(opts) {
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    // createAllDayEvent : la date de fin est exclusive → +1 jour
    const dateFinCal = new Date(opts.dateFin);
    dateFinCal.setDate(dateFinCal.getDate() + 1);

    const options = {
      description: opts.description || '',
      location: V2_CONFIG.adresse,
    };
    if (opts.guestEmail) {
      options.guests = opts.guestEmail;
      options.sendInvites = true;
    }

    const event = calendar.createAllDayEvent(
      opts.title,
      new Date(opts.dateDebut),
      dateFinCal,
      options
    );
    return event ? event.getId() : null;
  } catch (e) {
    console.error('Erreur calendrier : ' + e);
    return null;
  }
}

/**
 * Supprime best-effort l'événement d'une réservation annulée :
 * on cherche sur la période un événement dont l'invité ou la description
 * contient l'email. Aucune erreur n'est propagée.
 */
function deleteBookingEventBestEffort(dateDebut, dateFin, email) {
  try {
    if (!dateDebut || !dateFin || !email) return false;
    const calendar = CalendarApp.getDefaultCalendar();
    const from = new Date(dateDebut);
    from.setDate(from.getDate() - 1);
    const to = new Date(dateFin);
    to.setDate(to.getDate() + 2);

    const needle = String(email).toLowerCase();
    const events = calendar.getEvents(from, to);
    let deleted = false;

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      let match = String(ev.getDescription() || '').toLowerCase().indexOf(needle) !== -1;
      if (!match) {
        try {
          const guests = ev.getGuestList();
          for (let g = 0; g < guests.length; g++) {
            if (String(guests[g].getEmail() || '').toLowerCase() === needle) {
              match = true;
              break;
            }
          }
        } catch (inner) {
          // getGuestList peut échouer selon les droits : on ignore
        }
      }
      if (match) {
        ev.deleteEvent();
        deleted = true;
      }
    }
    return deleted;
  } catch (e) {
    console.error('Suppression événement (best-effort) échouée : ' + e);
    return false;
  }
}

// ============================================================
// A1 — Génération du fichier .ics (pièce jointe)
// ============================================================
/** Échappe les caractères réservés d'un champ texte iCalendar. */
function icsEscapeText(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');
}

/** Format DATE iCalendar (YYYYMMDD) en heure locale du script. */
function icsDateValue(date) {
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyyMMdd');
}

/** Format DATE-TIME UTC iCalendar (YYYYMMDDTHHMMSSZ). */
function icsStampValue(date) {
  return Utilities.formatDate(new Date(date), 'UTC', "yyyyMMdd'T'HHmmss'Z'");
}

/**
 * Construit la pièce jointe .ics (événement journée entière, METHOD:PUBLISH).
 * @return {Object|null} objet attachment MailApp, ou null si échec.
 */
function buildIcsAttachment(opts) {
  try {
    const dtStart = icsDateValue(opts.dateDebut);
    // DTEND est exclusif pour un événement journée entière → date de fin + 1
    const finExclusive = new Date(opts.dateFin);
    finExclusive.setDate(finExclusive.getDate() + 1);
    const dtEnd = icsDateValue(finExclusive);

    // UID stable et unique : dérivé de la réservation (pas d'aléatoire)
    const uid = Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        String(opts.uidSeed) + '|' + dtStart + '|' + dtEnd
      )
    ).replace(/=+$/, '') + '@weekends-chez-alex';

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//weekends-chez-alex//reservation//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + icsStampValue(new Date()),
      'DTSTART;VALUE=DATE:' + dtStart,
      'DTEND;VALUE=DATE:' + dtEnd,
      'SUMMARY:' + icsEscapeText(opts.title),
      'LOCATION:' + icsEscapeText(V2_CONFIG.adresse),
      'DESCRIPTION:' + icsEscapeText(
        (opts.description || '') + '\n' + V2_CONFIG.adresse + '\n' + V2_CONFIG.mapsGoogle
      ),
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    return {
      fileName: 'weekend-st-georges.ics',
      content: lines.join('\r\n') + '\r\n',
      mimeType: 'text/calendar',
    };
  } catch (e) {
    console.error('Génération .ics échouée : ' + e);
    return null;
  }
}

// ============================================================
// A3 — Notification au propriétaire
// ============================================================
/** Email du propriétaire (config, sinon utilisateur courant). */
function getHostEmail() {
  try {
    return CONFIG.hostEmail || Session.getActiveUser().getEmail() || '';
  } catch (e) {
    console.error('hostEmail indisponible : ' + e);
    return CONFIG.hostEmail || '';
  }
}

/** Prévient l'hôte d'une nouvelle réservation. Échec non bloquant. */
function notifyOwnerNewBooking(info) {
  try {
    const hostEmail = getHostEmail();
    if (!hostEmail) {
      console.error('Notification propriétaire ignorée : email hôte inconnu.');
      return false;
    }
    MailApp.sendEmail({
      to: hostEmail,
      replyTo: info.email,
      subject: '📬 Nouvelle réservation ' + info.type + ' — ' + info.label,
      body:
        'Nouvelle réservation enregistrée.\n\n' +
        'Type      : ' + info.type + '\n' +
        'Créneau   : ' + info.label + '\n' +
        'Ligne     : ' + info.rowIndex + '\n' +
        'Nom       : ' + info.nom + '\n' +
        'Email     : ' + info.email + '\n' +
        (info.nbPersonnes ? 'Nb pers.  : ' + info.nbPersonnes + '\n' : '') +
        (info.joursChoisis ? 'Jours     : ' + info.joursChoisis + '\n' : '') +
        'Message   : ' + (info.message || '(aucun)') + '\n',
    });
    return true;
  } catch (e) {
    console.error('Erreur notification propriétaire : ' + e);
    return false;
  }
}

/** Prévient l'hôte d'une annulation. Échec non bloquant. */
function notifyOwnerCancellation(info) {
  try {
    const hostEmail = getHostEmail();
    if (!hostEmail) return false;
    MailApp.sendEmail({
      to: hostEmail,
      subject: '🚫 Annulation ' + info.type + ' — ' + info.label,
      body:
        'Une réservation vient d\'être annulée via le lien d\'annulation.\n\n' +
        'Type    : ' + info.type + '\n' +
        'Créneau : ' + info.label + '\n' +
        'Ligne   : ' + info.rowIndex + '\n' +
        'Nom     : ' + (info.nom || '(inconnu)') + '\n' +
        'Email   : ' + info.email + '\n\n' +
        'Le créneau est de nouveau « Disponible ».\n',
    });
    return true;
  } catch (e) {
    console.error('Erreur notification annulation : ' + e);
    return false;
  }
}

// ============================================================
// A4 — Lien d'annulation signé
// ============================================================
/**
 * Spécification d'un feuillet réservable, pour les traitements génériques
 * (annulation, rappels). Les indices de colonnes sont 1-indexés.
 */
function getBookingSpec(type) {
  if (type === 'groupe') {
    return {
      type: 'groupe',
      sheetName: CONFIG.sheetName,
      label: 1, dateDebut: 2, dateFin: 3, statut: 4,
      nom: 5, email: 6, message: 7, jours: 0, dateResa: 8,
      lastCol: 8,
    };
  }
  if (type === 'solo') {
    return {
      type: 'solo',
      sheetName: SOLO_CONFIG.sheetName,
      label: SOLO_CONFIG.col.label,
      dateDebut: SOLO_CONFIG.col.dateDebut,
      dateFin: SOLO_CONFIG.col.dateFin,
      statut: SOLO_CONFIG.col.statut,
      nom: SOLO_CONFIG.col.nom,
      email: SOLO_CONFIG.col.email,
      message: SOLO_CONFIG.col.message,
      jours: SOLO_CONFIG.col.jours,
      dateResa: SOLO_CONFIG.col.dateResa,
      lastCol: SOLO_CONFIG.col.dateResa,
    };
  }
  return null;
}

/** Secret HMAC : CANCEL_SECRET, avec repli sur API_TOKEN. */
function getCancelSecret() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty('CANCEL_SECRET') || props.getProperty('API_TOKEN') || '';
}

/** Signature HMAC-SHA256 base64 web-safe du triplet (type,row,email). */
function computeCancelSignature(type, rowIndex, email) {
  const secret = getCancelSecret();
  if (!secret) return '';
  const payload = String(type) + '|' + String(rowIndex) + '|' + String(email).trim().toLowerCase();
  const raw = Utilities.computeHmacSha256Signature(payload, secret);
  return Utilities.base64EncodeWebSafe(raw).replace(/=+$/, '');
}

/** Comparaison à temps constant de deux chaînes. */
function constantTimeEquals(a, b) {
  const sa = String(a === null || a === undefined ? '' : a);
  const sb = String(b === null || b === undefined ? '' : b);
  if (sa.length !== sb.length) return false;
  let diff = 0;
  for (let i = 0; i < sa.length; i++) {
    diff |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  }
  return diff === 0;
}

/** URL complète d'annulation, ou '' si indisponible (secret ou URL manquants). */
function buildCancelUrl(type, rowIndex, email) {
  try {
    const sig = computeCancelSignature(type, rowIndex, email);
    if (!sig) {
      console.error('Lien d\'annulation non généré : ni CANCEL_SECRET ni API_TOKEN.');
      return '';
    }
    // URL figée en priorité (cf. WEBAPP_URL) ; getUrl() en repli seulement.
    let base = WEBAPP_URL;
    if (!base) {
      try { base = ScriptApp.getService().getUrl(); } catch (urlErr) { base = ''; }
    }
    if (!base) return '';
    return base +
      '?action=cancel' +
      '&type=' + encodeURIComponent(type) +
      '&row=' + encodeURIComponent(String(rowIndex)) +
      '&email=' + encodeURIComponent(email) +
      '&sig=' + encodeURIComponent(sig);
  } catch (e) {
    console.error('buildCancelUrl : ' + e);
    return '';
  }
}

/** Échappement HTML minimal pour la page de retour. */
function escapeHtmlText(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Page HTML de retour après un clic sur le lien d'annulation. */
function cancelHtmlPage(titre, corps) {
  const html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;' +
    'max-width:520px;margin:48px auto;padding:24px;line-height:1.5;' +
    'border:1px solid #e0e0e0;border-radius:12px">' +
    '<h1 style="font-size:20px;margin:0 0 12px">' + escapeHtmlText(titre) + '</h1>' +
    '<p style="margin:0;color:#444">' + escapeHtmlText(corps) + '</p>' +
    '</div>';
  return HtmlService.createHtmlOutput(html)
    .setTitle('Annulation — Weekends chez ' + CONFIG.hostName);
}

/**
 * Traite ?action=cancel&type=…&row=…&email=…&sig=…
 * Renvoie toujours une page HTML lisible. Idempotent.
 */
function handleCancelRequest(params) {
  try {
    const type = String(params.type || '').trim();
    const rowIndex = parseInt(params.row, 10);
    const email = String(params.email || '').trim();
    const sig = String(params.sig || '').trim();

    const spec = getBookingSpec(type);
    if (!spec || !rowIndex || isNaN(rowIndex) || rowIndex < 2 || !email || !sig) {
      return cancelHtmlPage('Lien invalide',
        'Ce lien d\'annulation n\'est pas valide. Réponds simplement à l\'email de confirmation.');
    }

    const expected = computeCancelSignature(type, rowIndex, email);
    if (!expected || !constantTimeEquals(expected, sig)) {
      return cancelHtmlPage('Lien invalide',
        'Ce lien d\'annulation n\'est pas valide ou a expiré. Réponds simplement à l\'email de confirmation.');
    }

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (e) {
      console.error('LockService (annulation) : verrou non obtenu — ' + e);
      return cancelHtmlPage('Serveur occupé',
        'Le serveur est occupé, réessaie dans quelques secondes.');
    }

    let label = '', nom = '', dateDebut = null, dateFin = null, libere = false;
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(spec.sheetName);
      if (!sheet || rowIndex > sheet.getLastRow()) {
        return cancelHtmlPage('Créneau introuvable',
          'Ce créneau n\'existe plus. Il n\'y a rien à annuler.');
      }

      const row = sheet.getRange(rowIndex, 1, 1, spec.lastCol).getValues()[0];
      label = String(row[spec.label - 1] || '');
      nom = String(row[spec.nom - 1] || '');
      dateDebut = row[spec.dateDebut - 1] ? new Date(row[spec.dateDebut - 1]) : null;
      dateFin = row[spec.dateFin - 1] ? new Date(row[spec.dateFin - 1]) : null;
      const rowEmail = String(row[spec.email - 1] || '').trim().toLowerCase();
      const statut = row[spec.statut - 1];

      // Idempotence : déjà libéré → message neutre, pas une erreur
      if (statut !== 'Réservé' || !rowEmail) {
        return cancelHtmlPage('Créneau déjà libre',
          'Ce créneau est déjà libre — rien à faire de plus.');
      }
      if (rowEmail !== email.toLowerCase()) {
        return cancelHtmlPage('Créneau déjà libre',
          'Ce créneau est déjà libre — rien à faire de plus.');
      }

      sheet.getRange(rowIndex, spec.statut).setValue('Disponible');
      sheet.getRange(rowIndex, spec.nom).setValue('');
      sheet.getRange(rowIndex, spec.email).setValue('');
      sheet.getRange(rowIndex, spec.message).setValue('');
      if (spec.jours) sheet.getRange(rowIndex, spec.jours).setValue('');
      sheet.getRange(rowIndex, spec.dateResa).setValue('');

      // Réinitialise le marqueur de rappel si la colonne existe déjà
      const reminderCol = findReminderColumn(sheet);
      if (reminderCol) sheet.getRange(rowIndex, reminderCol).setValue('');

      SpreadsheetApp.flush();
      libere = true;
    } finally {
      lock.releaseLock();
    }

    if (libere) {
      // Best-effort, hors section critique
      deleteBookingEventBestEffort(dateDebut, dateFin, email);
      notifyOwnerCancellation({
        type: spec.type, label: label, nom: nom, email: email, rowIndex: rowIndex,
      });
    }

    return cancelHtmlPage('Réservation annulée',
      'C\'est fait : le créneau « ' + label + ' » est de nouveau disponible. ' +
      'Merci d\'avoir prévenu !');
  } catch (err) {
    console.error('handleCancelRequest error: ' + err);
    return cancelHtmlPage('Erreur',
      'Une erreur est survenue. Réponds simplement à l\'email de confirmation.');
  }
}

// ============================================================
// A5 — Rappel automatique J-3
// ============================================================
/** Index (1-indexé) de la colonne « Rappel envoyé », ou 0 si absente. */
function findReminderColumn(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return 0;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const wanted = V2_CONFIG.reminderHeader.toLowerCase();
  for (let c = 0; c < headers.length; c++) {
    if (String(headers[c] || '').trim().toLowerCase() === wanted) return c + 1;
  }
  return 0;
}

/**
 * Retourne l'index de la colonne « Rappel envoyé », en la créant au bout
 * du feuillet si elle n'existe pas. N'écrase jamais une colonne existante :
 * on n'écrit que dans une colonne dont l'en-tête est vide, sinon on ajoute.
 */
function ensureReminderColumn(sheet) {
  const existing = findReminderColumn(sheet);
  if (existing) return existing;

  const target = sheet.getLastColumn() + 1;
  if (target > sheet.getMaxColumns()) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), target - sheet.getMaxColumns());
  }
  const cell = sheet.getRange(1, target);
  if (String(cell.getValue() || '').trim() !== '') {
    Logger.log('Colonne rappel non créée : la cellule d\'en-tête ' + target + ' n\'est pas vide.');
    return 0;
  }
  cell.setValue(V2_CONFIG.reminderHeader);
  cell.setFontWeight('bold');
  return target;
}

/** Nombre de jours calendaires entre aujourd'hui et une date (minuit à minuit). */
function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/**
 * Envoie les rappels J-3 pour les réservations « Réservé ».
 * Anti-doublon via la colonne « Rappel envoyé ». Idempotent.
 * Déclenché quotidiennement par le trigger installé par setupReminders().
 */
function sendReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const types = ['groupe', 'solo'];
  let sent = 0;

  types.forEach(function (type) {
    const spec = getBookingSpec(type);
    const sheet = ss.getSheetByName(spec.sheetName);
    if (!sheet) return;

    const reminderCol = ensureReminderColumn(sheet);
    if (!reminderCol) {
      Logger.log('Rappels [' + type + '] ignorés : colonne « ' + V2_CONFIG.reminderHeader + ' » indisponible.');
      return;
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    const width = Math.max(spec.lastCol, reminderCol);
    const data = sheet.getRange(2, 1, lastRow - 1, width).getValues();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowIndex = i + 2;

      if (row[spec.statut - 1] !== 'Réservé') continue;
      if (String(row[reminderCol - 1] || '').trim() !== '') continue; // déjà envoyé

      const dateDebutRaw = row[spec.dateDebut - 1];
      if (!dateDebutRaw) continue;
      const dateDebut = new Date(dateDebutRaw);
      if (isNaN(dateDebut.getTime())) continue;
      if (daysUntil(dateDebut) !== V2_CONFIG.reminderDaysBefore) continue;

      const email = String(row[spec.email - 1] || '').trim();
      if (!isValidEmail(email)) continue;

      const label = String(row[spec.label - 1] || '');
      const nom = String(row[spec.nom - 1] || '');
      const jours = spec.jours ? String(row[spec.jours - 1] || '') : '';

      const ok = sendReminderEmail({
        type: type, email: email, nom: nom, label: label,
        jours: jours, rowIndex: rowIndex,
      });

      if (ok) {
        sheet.getRange(rowIndex, reminderCol).setValue(new Date());
        sent++;
      }
    }
  });

  SpreadsheetApp.flush();
  Logger.log('Rappels J-' + V2_CONFIG.reminderDaysBefore + ' : ' + sent + ' email(s) envoyé(s).');
  return sent;
}

/** Envoie un email de rappel. Retourne true si parti. */
function sendReminderEmail(info) {
  try {
    const cancelUrl = buildCancelUrl(info.type, info.rowIndex, info.email);
    const hostEmail = getHostEmail();
    const mail = {
      to: info.email,
      subject: '⏰ J-' + V2_CONFIG.reminderDaysBefore + ' — ' + info.label,
      body:
        'Salut ' + (info.nom || '') + ' !\n\n' +
        'Petit rappel : c\'est dans ' + V2_CONFIG.reminderDaysBefore +
        ' jours — ' + info.label + '.\n' +
        (info.jours ? 'Jours prévus : ' + info.jours + '\n' : '') +
        '\n' + infosPratiquesTexte() + '\n' +
        cancelBlocTexte(cancelUrl) +
        'À très vite !\n' +
        CONFIG.hostName,
    };
    if (hostEmail) mail.replyTo = hostEmail;
    MailApp.sendEmail(mail);
    return true;
  } catch (e) {
    console.error('Erreur email rappel (ligne ' + info.rowIndex + ') : ' + e);
    return false;
  }
}

/**
 * À lancer UNE FOIS : (ré)installe le trigger quotidien des rappels (9h),
 * sans doublon, et crée les colonnes « Rappel envoyé » manquantes.
 */
function setupReminders() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendReminders') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('sendReminders')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['groupe', 'solo'].forEach(function (type) {
    const spec = getBookingSpec(type);
    const sheet = ss.getSheetByName(spec.sheetName);
    if (sheet) ensureReminderColumn(sheet);
  });

  Logger.log('Rappels installés : trigger quotidien à 9h + colonnes « ' +
    V2_CONFIG.reminderHeader + ' » vérifiées.');
}
