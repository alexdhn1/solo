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
//      API_TOKEN = un secret long aléatoire
//    Reporte la même valeur dans common.js du repo weekends-chez-alex
//    (à la place de 'CHANGE_ME_TOKEN')
// 3. Lance setupLot1() une fois (réinstalle le trigger, sans doublon)
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

  // -- Google Calendar (hors section critique, échec non bloquant) --
  try {
    const calendar   = CalendarApp.getDefaultCalendar();
    const dateFinCal = new Date(dateFin);
    dateFinCal.setDate(dateFinCal.getDate() + 1);
    calendar.createAllDayEvent(
      '🏠 ' + nom + ' — Weekend (' + nbPersonnes + ' pers.)',
      dateDebut,
      dateFinCal,
      {
        description:
          '👤 Invité   : ' + nom         + '\n' +
          '👥 Nb pers. : ' + nbPersonnes + '\n' +
          '📧 Email    : ' + email       + '\n' +
          '💬 Message  : ' + message
      }
    );
  } catch (e) {
    console.error('Erreur calendrier : ' + e);
  }

  // -- Email de confirmation (échec non bloquant, message adapté) --
  let mailSent = true;
  try {
    const hostEmail = CONFIG.hostEmail || Session.getActiveUser().getEmail();
    MailApp.sendEmail({
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
        'À très bientôt à St-Georges-sur-Cher !\n' +
        CONFIG.hostName
    });
  } catch (e) {
    console.error('Erreur email : ' + e);
    mailSent = false;
  }

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

  let label;
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

    const soloDebut = new Date(row[SOLO_CONFIG.col.dateDebut - 1]);
    const soloFin = new Date(row[SOLO_CONFIG.col.dateFin - 1]);

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

  // 4) Email de confirmation — hors section critique, échec non bloquant
  const mailSent = sendSoloConfirmationEmail(input, label);

  return {
    success: true,
    message: mailSent
      ? 'C\'est confirmé pour le ' + label + ' en solo 🎉 Un email de confirmation t\'a été envoyé !'
      : 'C\'est confirmé pour le ' + label + ' en solo 🎉 En revanche, l\'email de confirmation n\'a pas pu partir — note bien la date !',
  };
}

/** Envoie l'email de confirmation solo. Retourne true si envoyé. */
function sendSoloConfirmationEmail(input, label) {
  try {
    MailApp.sendEmail({
      to: input.email,
      subject: '✅ Weekend solo confirmé — ' + label,
      body:
        'Salut ' + input.nom + ' !\n\n' +
        'C\'est confirmé pour le ' + label + ' en mode solo/tête-à-tête.\n' +
        (input.joursChoisis ? 'Jours choisis : ' + input.joursChoisis + '\n' : '') +
        (input.message ? 'Ton message : « ' + input.message + ' »\n' : '') +
        '\nÀ très bientôt à St-Georges-sur-Cher !\n' +
        SOLO_CONFIG.hostName,
    });
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
