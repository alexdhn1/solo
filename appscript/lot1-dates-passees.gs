// ============================================================
// LOT 1 — FILTRE DES DATES PASSÉES + ARCHIVAGE AUTO
// À coller à la fin de code.gs (NE PAS supprimer le code existant)
// ============================================================
// Installation :
// 1. Colle ce fichier à la fin de code.gs
// 2. REMPLACE l'ancienne fonction getSoloWeekends() par celle ci-dessous
//    (supprime l'ancienne version pour éviter le doublon)
// 3. Ajoute le filtre isPastSlot() dans getWeekends() et dans la fonction
//    utilisée par vacances.html (voir "MODIFIER" ci-dessous)
// 4. Lance setupLot1() UNE FOIS depuis l'éditeur (autorise les droits demandés)
// 5. Redéploie : Déployer → Gérer les déploiements → ✏️ Modifier →
//    Version : "Nouvelle version" → Déployer
//    ⚠️ Bien MODIFIER le déploiement existant (pas "Nouveau déploiement"),
//    sinon l'URL /exec change et les sites cassent.
// ============================================================

// ------------------------------------------------------------
// CONFIG ARCHIVAGE
// Pour chaque feuillet : la colonne qui contient la DATE DE FIN
// (A=1, B=2, C=3...). Vérifie que ça correspond à ta Sheet.
// ------------------------------------------------------------
const LOT1_CONFIG = {
  archiveSheetName: 'Archive',
  sheets: [
    { name: 'Reservations', dateFinCol: 3 }, // colonne C = date de fin
    { name: 'Solo',         dateFinCol: 3 }, // colonne C = date de fin
    { name: 'Vacances',     dateFinCol: 3 }, // ⚠️ à vérifier selon ta structure
  ],
};

// ------------------------------------------------------------
// HELPER — un créneau est "passé" si sa date de fin est avant aujourd'hui
// ------------------------------------------------------------
function isPastSlot(dateFin) {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var fin = new Date(dateFin);
  fin.setHours(0, 0, 0, 0);
  return fin < today;
}

// ============================================================
// MODIFIER getWeekends() (weekends groupe, index.html)
// Dans la boucle qui construit la liste des weekends disponibles,
// ajoute cette ligne juste après la lecture de la date de fin :
//
//   if (isPastSlot(dateFin)) continue;
//
// (adapte le nom de la variable à ton code existant)
// ============================================================

// ============================================================
// MODIFIER la fonction getAll() utilisée par vacances.html
// Même principe : dans la boucle, ignorer les lignes dont la
// date de fin est passée :
//
//   if (isPastSlot(dateFin)) continue;
// ============================================================

// ============================================================
// REMPLACE l'ancienne getSoloWeekends() par cette version
// (identique + filtre des dates passées)
// ============================================================
function getSoloWeekends() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Lire les dates occupées du feuillet Reservations (grands weekends)
  const reservationsSheet = ss.getSheetByName('Reservations');
  const reservationsData = reservationsSheet.getDataRange().getValues();
  const busyDates = [];

  for (var i = 1; i < reservationsData.length; i++) {
    var status = reservationsData[i][3];
    if (status === 'Réservé') {
      var debut = new Date(reservationsData[i][1]);
      var fin = new Date(reservationsData[i][2]);
      // Ajouter une marge : vendredi avant au lundi après (groupe occupe la maison)
      var margeDebut = new Date(debut);
      margeDebut.setDate(margeDebut.getDate() - 1); // vendredi
      var margeFin = new Date(fin);
      margeFin.setDate(margeFin.getDate() + 1); // lundi
      busyDates.push({ start: margeDebut, end: margeFin });
    }
  }

  // Lire le feuillet Solo
  var soloSheet = ss.getSheetByName(SOLO_CONFIG.sheetName);
  if (!soloSheet) return [];

  var soloData = soloSheet.getDataRange().getValues();
  var dispo = [];

  for (var j = 1; j < soloData.length; j++) {
    if (soloData[j][3] !== 'Disponible') continue;

    var soloDebut = new Date(soloData[j][1]);
    var soloFin = new Date(soloData[j][2]);

    // LOT 1 : ne jamais proposer un créneau dont la date de fin est passée
    if (isPastSlot(soloFin)) continue;

    // Vérifier pas de conflit avec weekends groupe
    var hasConflict = false;
    for (var k = 0; k < busyDates.length; k++) {
      if (!(soloFin < busyDates[k].start || soloDebut > busyDates[k].end)) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      dispo.push({
        rowIndex: j + 1,
        label: soloData[j][0],
        dateDebut: soloData[j][1],
        dateFin: soloData[j][2]
      });
    }
  }

  return dispo;
}

// ============================================================
// ARCHIVAGE AUTO — déplace les lignes passées vers l'onglet Archive
// Tourne chaque nuit via le trigger installé par setupLot1()
// ============================================================
function archivePastRows() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Créer l'onglet Archive s'il n'existe pas
  var archive = ss.getSheetByName(LOT1_CONFIG.archiveSheetName);
  if (!archive) {
    archive = ss.insertSheet(LOT1_CONFIG.archiveSheetName);
    archive.appendRow(['Feuillet source', 'Archivé le', '→ données de la ligne originale']);
  }

  LOT1_CONFIG.sheets.forEach(function(cfg) {
    var sheet = ss.getSheetByName(cfg.name);
    if (!sheet) return; // feuillet absent : on ignore

    var data = sheet.getDataRange().getValues();
    var rowsToDelete = [];

    for (var i = 1; i < data.length; i++) {
      var dateFin = data[i][cfg.dateFinCol - 1];
      if (!dateFin) continue; // ligne sans date : on ne touche pas
      if (!isPastSlot(dateFin)) continue;

      // Copier vers Archive avec la provenance et la date d'archivage
      archive.appendRow([cfg.name, new Date()].concat(data[i]));
      rowsToDelete.push(i + 1); // index de ligne réel dans la Sheet
    }

    // Supprimer de bas en haut pour ne pas décaler les index
    for (var d = rowsToDelete.length - 1; d >= 0; d--) {
      sheet.deleteRow(rowsToDelete[d]);
    }
  });
}

// ============================================================
// SETUP — à lancer UNE FOIS depuis l'éditeur Apps Script
// Installe le trigger quotidien (entre 4h et 5h du matin)
// ============================================================
function setupLot1() {
  // Supprimer un éventuel ancien trigger pour éviter les doublons
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'archivePastRows') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('archivePastRows')
    .timeBased()
    .everyDays(1)
    .atHour(4)
    .create();

  // Premier passage immédiat pour nettoyer l'existant
  archivePastRows();

  Logger.log('Lot 1 installé : trigger quotidien à 4h + premier archivage effectué.');
}
