// ============================================================
// SOLO WEEKENDS — À AJOUTER dans code.gs (NE PAS supprimer le code existant)
// ============================================================
// Instructions :
// 1. Ouvre ton Apps Script lié à la Sheet
// 2. Colle CE CODE à la fin du fichier code.gs existant
// 3. Colle AUSSI lot1-dates-passees.gs (il fournit isPastSlot(), utilisé ici)
// 4. Modifie doGet() et doPost() existants pour ajouter les nouvelles actions
//    (voir les commentaires "MODIFIER" ci-dessous)
// 5. Applique le patch "BLOCAGE GROUPE → SOLO" sur submitReservation()
//    (voir la section dédiée en bas de ce fichier)
// 6. Lance initSoloSheet() une fois depuis l'éditeur Apps Script
// 7. Redéploie le web app : Déployer → Gérer les déploiements → ✏️ Modifier →
//    Version : "Nouvelle version" → Déployer
//    ⚠️ Bien MODIFIER le déploiement existant (pas "Nouveau déploiement"),
//    sinon l'URL /exec change et le front casse.
// ============================================================
//
// CONTRAT D'API (partagé avec le front) :
//   POST { action:'soloReservation', rowIndex, label, nom, email, message, joursChoisis }
//   Réponse : { success: boolean, code?: string, message: string }
//   Codes d'erreur : STALE_SLOT | ALREADY_BOOKED | PAST_SLOT | INVALID_INPUT | CONFLICT_GROUP
//   Le front re-fetch la liste complète des créneaux sur tout success:false.
// ============================================================

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
  // Longueurs maximales acceptées (au-delà : INVALID_INPUT)
  maxLen: { nom: 100, email: 254, message: 1000, jours: 60 },
  // Anti-abus : 3 requêtes par tranche de 10 minutes et par email
  rateLimit: { maxRequests: 3, windowSeconds: 600 },
};

// Enum des valeurs acceptées pour joursChoisis.
// ⚠️ Doit rester synchronisé avec JOURS_OPTIONS du front
// (src/features/solo-booking/components/SoloForm.tsx).
const SOLO_JOURS_OPTIONS = [
  'Vendredi → Dimanche',
  'Vendredi → Lundi (+ 1 jour TT)',
  'Vendredi → Mardi (+ 2 jours TT)',
  'Samedi → Dimanche',
  'Samedi → Lundi (+ TT lundi)',
  'Samedi → Mardi (+ TT lun-mar)',
];

const SOLO_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// ============================================================
// MODIFIER doGet() — Ajouter ce bloc dans le if/else existant :
// ============================================================
//
//   if (action === 'getSoloWeekends') {
//     return jsonResponse(getSoloWeekends());
//   }
//

// ============================================================
// MODIFIER doPost() — Remplacer le try/catch par :
// ============================================================
//
//   try {
//     const data = JSON.parse(e.postData.contents);
//
//     if (data.action === 'soloReservation') {
//       return jsonResponse(submitSoloReservation(data));
//     }
//
//     // Comportement existant (réservations groupe)
//     return jsonResponse(submitReservation(data));
//   } catch (err) {
//     // ⚠️ Ne JAMAIS renvoyer err.toString() au client (fuite d'info interne).
//     console.error('doPost error: ' + err);
//     return jsonResponse({
//       success: false,
//       code: 'SERVER_ERROR',
//       message: "Une erreur est survenue côté serveur. Réessaie dans un instant.",
//     });
//   }
//

// ============================================================
// HELPERS — sécurité & validation
// ============================================================

/**
 * Protection contre l'injection de formule dans Sheets.
 * Préfixe la valeur d'une apostrophe si elle commence par = + - @
 * (ou par un caractère de contrôle tab/CR utilisé pour contourner le filtre).
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

/** Réponse d'erreur normalisée conforme au contrat d'API. */
function soloError(code, message) {
  return { success: false, code: code, message: message };
}

/**
 * Valide et normalise le payload de réservation solo.
 * Retourne { ok:true, value:{...} } ou { ok:false, error:{success:false,code,message} }.
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
    return {
      ok: false,
      error: soloError('INVALID_INPUT', 'Le nom est trop long (' + SOLO_CONFIG.maxLen.nom + ' caractères max).'),
    };
  }

  const email = truncate(data.email, SOLO_CONFIG.maxLen.email);
  if (!email || String(data.email).trim().length > SOLO_CONFIG.maxLen.email || !SOLO_EMAIL_REGEX.test(email)) {
    return { ok: false, error: soloError('INVALID_INPUT', 'Adresse email invalide.') };
  }

  const rawMessage = data.message === null || data.message === undefined ? '' : String(data.message).trim();
  if (rawMessage.length > SOLO_CONFIG.maxLen.message) {
    return {
      ok: false,
      error: soloError('INVALID_INPUT', 'Le message est trop long (' + SOLO_CONFIG.maxLen.message + ' caractères max).'),
    };
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
 * Rate-limit simple par email : SOLO_CONFIG.rateLimit.maxRequests requêtes
 * par fenêtre glissante de windowSeconds. Retourne true si la requête est autorisée.
 * CacheService est best-effort (éviction possible) : c'est un garde-fou anti-abus,
 * pas une garantie de sécurité forte.
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
    // Cache indisponible : on ne bloque pas la réservation légitime.
    console.error('Rate-limit cache indisponible : ' + e);
    return true;
  }
}

// ============================================================
// HELPERS — chevauchement de dates (factorisé, cf. B7)
// ============================================================

/** true si les deux intervalles [aStart,aEnd] et [bStart,bEnd] se chevauchent. */
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return !(aEnd < bStart || aStart > bEnd);
}

/**
 * Renvoie les périodes occupées par les weekends GROUPE (statut « Réservé »),
 * élargies d'un jour de chaque côté (vendredi avant → lundi après :
 * le groupe occupe la maison).
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
    margeDebut.setDate(margeDebut.getDate() - 1); // vendredi avant
    const margeFin = new Date(reservationsData[i][2]);
    margeFin.setDate(margeFin.getDate() + 1); // lundi après

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
// LECTURE — Weekends solo disponibles
// (filtre les conflits groupe + les créneaux passés — cf. lot1-dates-passees.gs)
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

    // Ne jamais proposer un créneau dont la date de fin est passée (isPastSlot :
    // défini dans lot1-dates-passees.gs, à coller dans le même projet Apps Script).
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
// RÉSERVATION SOLO — verrou, validation, anti double-booking, écriture Sheet
// ============================================================
function submitSoloReservation(formData) {
  // 1) Validation d'entrée (avant de prendre le verrou)
  const validation = validateSoloPayload(formData);
  if (!validation.ok) return validation.error;
  const input = validation.value;

  // 2) Rate-limit anti-abus mail
  if (!checkSoloRateLimit(input.email)) {
    return soloError(
      'INVALID_INPUT',
      'Trop de tentatives avec cet email. Réessaie dans une dizaine de minutes.'
    );
  }

  // 3) Section critique : un seul écrivain à la fois (anti double-booking)
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

    // 3a) Le rowIndex doit exister
    if (input.rowIndex > sheet.getLastRow()) {
      return soloError('STALE_SLOT', 'Ce créneau a changé, recharge la page.');
    }

    const row = sheet.getRange(input.rowIndex, 1, 1, SOLO_CONFIG.col.dateResa).getValues()[0];
    label = String(row[SOLO_CONFIG.col.label - 1]);

    // 3b) ID stable : le label envoyé par le front doit correspondre à la ligne.
    // Les lignes se décalent quand archivePastRows() supprime des lignes passées.
    if (label.trim() !== input.label) {
      return soloError('STALE_SLOT', 'Ce créneau a changé, recharge la page.');
    }

    // 3c) Déjà réservé ?
    if (row[SOLO_CONFIG.col.statut - 1] !== 'Disponible') {
      return soloError('ALREADY_BOOKED', "Désolé, ce créneau vient d'être pris ! Choisis une autre date.");
    }

    const soloDebut = new Date(row[SOLO_CONFIG.col.dateDebut - 1]);
    const soloFin = new Date(row[SOLO_CONFIG.col.dateFin - 1]);

    // 3d) Créneau passé
    if (isPastSlot(soloFin)) {
      return soloError('PAST_SLOT', 'Ce créneau est déjà passé. Choisis une autre date !');
    }

    // 3e) Conflit avec un weekend groupe (recalculé au moment de la résa)
    if (hasGroupConflict(soloDebut, soloFin)) {
      return soloError('CONFLICT_GROUP', 'Ce créneau chevauche un weekend groupe. Choisis une autre date !');
    }

    // 3f) Écriture — toute donnée utilisateur passe par sanitizeCell()
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

  // 4) Email de confirmation — hors section critique.
  // Un échec d'envoi n'annule PAS la réservation : on renvoie success:true
  // avec un message adapté (pas de « succès mensonger », pas de err.toString()).
  const mailSent = sendSoloConfirmationEmail(input, label);

  return {
    success: true,
    message: mailSent
      ? 'C\'est confirmé pour le ' + label + ' en solo 🎉 Un email de confirmation t\'a été envoyé !'
      : 'C\'est confirmé pour le ' + label +
        ' en solo 🎉 En revanche, l\'email de confirmation n\'a pas pu partir — note bien la date !',
  };
}

/**
 * Envoie l'email de confirmation. Retourne true en cas de succès, false sinon.
 * Le contenu utilisateur est déjà tronqué/validé en amont (validateSoloPayload).
 */
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

// ============================================================
// PATCH B6 — BLOCAGE GROUPE → SOLO
// ============================================================
// Problème : submitSoloReservation() vérifie les conflits avec le feuillet
// Reservations (groupe), mais submitReservation() (groupe) ne regarde PAS le
// feuillet Solo. Un weekend groupe peut donc être validé alors qu'un solo est
// déjà réservé sur les mêmes dates.
//
// Correctif : appeler hasSoloConflict() dans submitReservation(), juste après
// la vérification du statut de la ligne et AVANT toute écriture, à l'intérieur
// du même LockService.getScriptLock() :
//
//   // --- PATCH B6 : refuser si un weekend solo est déjà réservé sur ces dates
//   const conflit = hasSoloConflict(dateDebutGroupe, dateFinGroupe);
//   if (conflit) {
//     return {
//       success: false,
//       code: 'CONFLICT_GROUP',
//       message: 'Un weekend solo est déjà réservé sur ces dates (' + conflit + ').',
//     };
//   }
//
// (adapte dateDebutGroupe / dateFinGroupe aux variables de ton code existant)
//
// ⚠️ Pense aussi à envelopper submitReservation() dans
// LockService.getScriptLock() / waitLock(10000) / finally releaseLock(),
// comme submitSoloReservation() ci-dessus.
// ============================================================

/**
 * Retourne le label du premier créneau solo RÉSERVÉ qui chevauche
 * la période groupe [dateDebut, dateFin] (marge d'un jour de chaque côté,
 * cohérente avec getGroupBusyRanges()), ou null s'il n'y en a aucun.
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
// INITIALISATION SOLO — Lance une seule fois pour créer le feuillet
// ============================================================
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

  // En-têtes — doivent rester alignés avec SOLO_CONFIG.col et LOT1_CONFIG.dateFinHeader
  const headers = ['Créneau', 'Date début', 'Date fin', 'Statut', 'Nom', 'Email', 'Message', 'Jours choisis', 'Date réservation'];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#2d4a3e');
  headerRange.setFontColor('#ffffff');

  // Générer des créneaux : chaque weekend (ven-dim + possibilité lun-mar TT)
  // On génère des blocs vendredi→mardi pour chaque semaine
  const weekends = generateSoloWeekends(new Date(2026, 3, 17), new Date(2026, 11, 31));
  const rows = weekends.map(function (w) {
    return [w.label, w.dateDebut, w.dateFin, 'Disponible', '', '', '', '', ''];
  });

  sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  sheet.getRange(2, 2, rows.length, 2).setNumberFormat('dd/mm/yyyy');

  // Mise en forme conditionnelle
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

  // Trouver le premier vendredi à partir de startDate
  const current = new Date(startDate);
  while (current.getDay() !== 5) { // 5 = vendredi
    current.setDate(current.getDate() + 1);
  }

  while (current <= endDate) {
    const vendredi = new Date(current);
    const mardi = new Date(current);
    mardi.setDate(mardi.getDate() + 4); // vendredi + 4 = mardi

    let label;
    if (vendredi.getMonth() === mardi.getMonth()) {
      label = vendredi.getDate() + '-' + mardi.getDate() + ' ' + mois[vendredi.getMonth()] + ' ' + vendredi.getFullYear();
    } else {
      label = vendredi.getDate() + ' ' + mois[vendredi.getMonth()] + ' - ' + mardi.getDate() + ' ' + mois[mardi.getMonth()] + ' ' + vendredi.getFullYear();
    }
    label = label + ' (ven→mar)';

    weekends.push({ label: label, dateDebut: vendredi, dateFin: mardi });

    current.setDate(current.getDate() + 7); // un créneau par semaine
  }
  return weekends;
}
